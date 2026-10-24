"""
BookLeaf Publishing - Groq AI Service
Handles ticket auto-classification, priority scoring, author inquiry clarification chatbot,
and policy-grounded admin draft generation using Groq API without external vector database dependencies.
"""

import json
import re
from typing import Dict, Any, Optional, List
from app.config import Config
from app.constants import (
    TICKET_CATEGORIES,
    TICKET_PRIORITIES,
    BOOKLEAF_KNOWLEDGE_BASE,
    COMMUNICATION_GUIDELINES,
)
from app.services.supabase_service import supabase_service

try:
    from groq import Groq
except ImportError:
    Groq = Any

# Pre-compiled full BookLeaf policy context
FULL_BOOKLEAF_POLICY_TEXT = "\n\n".join([
    f"### {doc['title']} (Category: {doc['category']})\n{doc['content']}"
    for doc in BOOKLEAF_KNOWLEDGE_BASE
])

class AIService:
    def __init__(self):
        self.client: Optional[Groq] = None
        self.model: str = Config.GROQ_MODEL or "llama-3.3-70b-versatile"
        self._init_groq()

    def _init_groq(self):
        if Config.is_groq_configured():
            try:
                self.client = Groq(api_key=Config.GROQ_API_KEY)
            except Exception as e:
                print(f"[AIService] Failed to initialize Groq client: {e}")
                self.client = None
        else:
            self.client = None

    # ================= 1. AUTOMATIC TICKET CLASSIFICATION =================

    def classify_ticket(
        self,
        subject: str,
        description: str,
        book_metadata: Optional[Dict[str, Any]] = None,
        ticket_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Classifies a ticket into one of the 6 exact BookLeaf categories and 4 priority levels.
        Uses Groq structured JSON mode with deterministic rule fallback.
        """
        prompt_text = f"Subject: {subject}\nDescription: {description}"
        if book_metadata:
            prompt_text += f"\nAssociated Book: Title='{book_metadata.get('title')}', ISBN='{book_metadata.get('isbn')}', Status='{book_metadata.get('status')}'"

        system_instruction = f"""
You are the automated ticket triage AI for BookLeaf Publishing.
Analyze the author's query and classify it strictly according to BookLeaf operations.

Allowed Categories (pick exactly ONE):
1. 'Royalty & Payments': Unpaid royalties, calculation disputes, payment thresholds (₹1,000 min), bank details, quarterly cycles (within 45 days of quarter end).
2. 'ISBN & Metadata Issues': Duplicate ISBNs, wrong book mapped, retail blurb/description fixes, imprint questions.
3. 'Printing & Quality': Damaged author copies, binding defects, blurry images, misprints, paper/print quality complaints.
4. 'Distribution & Availability': Retail availability, 'Currently Unavailable' on Amazon/Flipkart, international distribution sync.
5. 'Book Status & Production Updates': Production stages (Manuscript -> Editing -> Cover -> Typeset -> Proof -> ISBN -> Print -> Distribute), delay queries.
6. 'General Inquiry': General questions, contract questions, platform navigation, non-urgent author bio updates.

Allowed Priorities (pick exactly ONE):
- 'Critical': Urgent, time-sensitive disruptions, royalties missing > 6 months, severe legal/financial escalations.
- 'High': Missing or overdue royalties, incorrect/conflicting ISBN on retail platforms, verified printing defect shipments.
- 'Medium': Routine operational issues, distribution stock sync requests, normal production progress inquiries.
- 'Low': General advice, non-urgent blurb updates, informational questions.

Respond strictly in valid JSON format:
{{
  "category": "<Exact Category Name>",
  "priority": "<Exact Priority Level>",
  "reason": "<One clear sentence explaining the decision>",
  "confidence": <number between 0.0 and 1.0>
}}
"""

        # Try Groq API
        if self.client:
            try:
                completion = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": prompt_text}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.1,
                    max_tokens=250,
                    timeout=10.0,
                )

                content = completion.choices[0].message.content or "{}"
                data = json.loads(content)

                cat = data.get("category", "")
                prio = data.get("priority", "")
                reason = data.get("reason", "Classified via BookLeaf AI model.")
                conf = float(data.get("confidence", 0.95))

                if cat in TICKET_CATEGORIES and prio in TICKET_PRIORITIES:
                    supabase_service.log_ai_operation(
                        ticket_id=ticket_id,
                        operation_type="classification",
                        model=self.model,
                        processing_status="success",
                        prompt_tokens=completion.usage.prompt_tokens if completion.usage else None,
                        completion_tokens=completion.usage.completion_tokens if completion.usage else None,
                        total_tokens=completion.usage.total_tokens if completion.usage else None,
                    )
                    return {
                        "category": cat,
                        "priority": prio,
                        "reason": reason,
                        "confidence": conf,
                        "ai_status": "completed",
                        "model": self.model
                    }
            except Exception as e:
                print(f"[AIService] Groq classification failed: {e}. Reverting to deterministic fallback.")
                supabase_service.log_ai_operation(
                    ticket_id=ticket_id,
                    operation_type="classification",
                    model=self.model,
                    processing_status="fallback",
                    error_message=str(e),
                )

        # Deterministic Fallback
        fallback = self._classify_deterministic_fallback(subject, description, book_metadata)
        fallback["ai_status"] = "fallback"
        fallback["model"] = "rule_based_fallback"
        return fallback

    def _classify_deterministic_fallback(
        self,
        subject: str,
        description: str,
        book_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Deterministic keyword and heuristic classifier when external LLM is offline."""
        text = f"{subject} {description}".lower()

        is_critical = any(kw in text for kw in ["6 months", "urgent", "legal", "fraud", "scam", "never received", "lawsuit"])
        is_high = any(kw in text for kw in ["wrong isbn", "defective", "damaged copies", "unpaid", "delay", "overdue", "mismatch"])

        if any(kw in text for kw in ["royalty", "royalties", "payout", "payment", "bank", "threshold", "earning", "sold 200", "net profit", "payouts"]):
            category = "Royalty & Payments"
            priority = "Critical" if is_critical else ("High" if "unpaid" in text or "not received" in text else "Medium")
            reason = "Financial / royalty inquiry identified."
        elif any(kw in text for kw in ["isbn", "barcode", "imprint", "wrong book"]):
            category = "ISBN & Metadata Issues"
            priority = "High"
            reason = "ISBN discrepancies require immediate production team escalation."
        elif any(kw in text for kw in ["print", "binding", "defect", "misprint", "color", "blurry", "physical copy", "cover quality", "paper"]):
            category = "Printing & Quality"
            priority = "High" if "defective" in text or "damaged" in text or "terrible" in text else "Medium"
            reason = "Printing defect or physical production quality inquiry."
        elif any(kw in text for kw in ["amazon", "flipkart", "unavailable", "out of stock", "listing", "retail", "store"]):
            category = "Distribution & Availability"
            priority = "Medium"
            reason = "Retail distribution channel inventory or listing query."
        elif any(kw in text for kw in ["typesetting", "stage", "proofreading", "cover design", "manuscript", "progress", "status update"]):
            category = "Book Status & Production Updates"
            priority = "Medium"
            reason = "Book publication pipeline milestone inquiry."
        else:
            category = "General Inquiry"
            priority = "Low"
            reason = "General author account or informational inquiry."

        if is_critical and priority != "Critical":
            priority = "Critical"

        return {
            "category": category,
            "priority": priority,
            "reason": f"[Deterministic Fallback] {reason}",
            "confidence": 0.85
        }

    # ================= 2. AUTHOR TICKET CLARIFIER / CHATBOT =================

    def clarify_inquiry(
        self,
        message: str,
        book_metadata: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Interactive AI Assistant for authors on the ticket submission page.
        Answers policy questions, explains timelines, asks for missing information,
        and provides suggested ticket subject and description drafts.
        """
        book_info = "No specific book selected (General Account inquiry)."
        if book_metadata:
            book_info = f"Book: '{book_metadata.get('title')}' (ISBN: {book_metadata.get('isbn')}, Status: {book_metadata.get('status')})"

        system_instruction = f"""
You are the BookLeaf AI Publishing Assistant for authors raising a support inquiry.
Your goal is to clarify the author's question, explain relevant BookLeaf policies clearly and empathetically,
and ensure the author has all information ready to submit an effective ticket.

OFFICIAL BOOKLEAF KNOWLEDGE BASE:
{FULL_BOOKLEAF_POLICY_TEXT}

{COMMUNICATION_GUIDELINES}

Author's Selected Book Context:
{book_info}

Instructions for your response:
1. Explain BookLeaf's exact policy concisely (e.g. 80/20 royalty split, ₹1,000 threshold, quarterly within 45 days; ISBN 48h resolution; free reprints for verified defects with photos; 24-48h stock sync).
2. Clarify what details or attachments BookLeaf's operations team will need (e.g. photos for defective copies, bank details confirmation for royalties).
3. If the author is ready to raise a ticket, provide a recommended "Suggested Subject" and "Suggested Description" formatted at the end of your response like this:
---
**Suggested Ticket Subject:** <clean concise subject>
**Suggested Ticket Description:** <structured description including all necessary details>
---
"""

        messages = [{"role": "system", "content": system_instruction}]

        if conversation_history:
            for item in conversation_history[-6:]:  # Keep recent turns for cost efficiency
                role = "user" if item.get("sender") == "author" else "assistant"
                messages.append({"role": role, "content": item.get("text", "")})

        messages.append({"role": "user", "content": message})

        if self.client:
            try:
                completion = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=0.3,
                    max_tokens=600,
                    timeout=12.0,
                )
                answer = completion.choices[0].message.content.strip()
                return {
                    "success": True,
                    "response": answer,
                    "model": self.model,
                }
            except Exception as e:
                print(f"[AIService] Chatbot clarification failed: {e}")

        # Fallback offline answer
        fallback_answer = (
            "Thank you for contacting BookLeaf Support. Based on our policies:\n\n"
            "• **Royalties**: 80% net profit to authors, paid quarterly within 45 days of quarter end (₹1,000 minimum threshold).\n"
            "• **ISBN Issues**: Treated as High Priority with 48-hour resolution.\n"
            "• **Printing Defects**: We offer a free reprint for verified defects; please share photos of the issue.\n"
            "• **Availability**: Out of stock on Amazon/Flipkart is usually a catalog sync issue resolved in 24-48 hours.\n\n"
            "You can submit your ticket below with your details and our team will investigate promptly."
        )
        return {
            "success": True,
            "response": fallback_answer,
            "model": "offline_policy_fallback"
        }

    # ================= 3. AI-DRAFTED RESPONSE FOR ADMINS =================

    def generate_draft_response(
        self,
        ticket: Dict[str, Any],
        book_metadata: Optional[Dict[str, Any]] = None,
        author_profile: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generates an empathetic, grounded draft response for BookLeaf admin review.
        Directly embeds the BookLeaf policies and operational records in the prompt.
        """
        subject = ticket.get("subject", "")
        description = ticket.get("description", "")
        category = ticket.get("category", "")
        ticket_id = ticket.get("id")

        book_info = "None specified (General Account Inquiry)."
        if book_metadata:
            book_info = (
                f"Title: {book_metadata.get('title')}\n"
                f"ISBN: {book_metadata.get('isbn')}\n"
                f"Status: {book_metadata.get('status')}\n"
                f"Copies Sold: {book_metadata.get('total_copies_sold', 0)}\n"
                f"Royalty Earned: ₹{book_metadata.get('total_royalty_earned', 0)}\n"
                f"Royalty Paid: ₹{book_metadata.get('royalty_paid', 0)}\n"
                f"Royalty Pending: ₹{book_metadata.get('royalty_pending', 0)}\n"
                f"Last Payout Date: {book_metadata.get('last_royalty_payout_date', 'None')}\n"
                f"Print Partner: {book_metadata.get('print_partner', 'In-House')}"
            )

        author_name = author_profile.get("full_name", "Author") if author_profile else "Author"

        system_prompt = f"""
You are the Senior Author Relations Specialist at BookLeaf Publishing.
Draft a professional, empathetic, and factual response to the author.

OFFICIAL BOOKLEAF KNOWLEDGE BASE:
{FULL_BOOKLEAF_POLICY_TEXT}

{COMMUNICATION_GUIDELINES}

Strict Rules:
- Address the author by name: '{author_name}'.
- Acknowledge their specific issue immediately with genuine empathy.
- Ground your response EXCLUSIVELY in the provided BookLeaf Policies and Book Details.
- If referencing royalties: cite the 80/20 split, ₹1,000 threshold, quarterly schedule (within 45 days of quarter end), or exact numbers if provided.
- If referencing ISBN errors: treat as high-priority and promise escalation to the production team with a 48-hour timeline.
- If referencing print defects: apologize sincerely, ask for photos for verification, and promise a free reprint in 5-7 business days once verified.
- If referencing Amazon/Flipkart 'unavailable': explain it is likely a stock sync issue and BookLeaf can trigger a re-sync within 24-48 hours.
- NEVER claim that an action has already been taken (e.g., do NOT say "we have already refunded/re-synced/reprinted") unless the data confirms it.
- End with a warm closing and a clear next step.
- Return ONLY the draft response body (no preamble, no 'Here is your draft:').
"""

        user_prompt = f"""
Author Name: {author_name}
Ticket Subject: {subject}
Ticket Description: {description}
Category: {category}

Associated Book Details:
{book_info}
"""

        # Try Groq API
        if self.client:
            try:
                completion = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.3,
                    max_tokens=650,
                    timeout=15.0,
                )

                draft_text = completion.choices[0].message.content.strip()
                supabase_service.log_ai_operation(
                    ticket_id=ticket_id,
                    operation_type="response_draft",
                    model=self.model,
                    processing_status="success",
                    prompt_tokens=completion.usage.prompt_tokens if completion.usage else None,
                    completion_tokens=completion.usage.completion_tokens if completion.usage else None,
                    total_tokens=completion.usage.total_tokens if completion.usage else None,
                )

                return {
                    "draft_response": draft_text,
                    "model_used": self.model,
                    "status": "success",
                    "retrieved_excerpts": [
                        {"title": "BookLeaf Knowledge Base Policies", "category": category, "source": "official_bookleaf_policy", "score": 1.0}
                    ]
                }
            except Exception as e:
                print(f"[AIService] Groq draft generation failed: {e}. Reverting to grounded template.")
                supabase_service.log_ai_operation(
                    ticket_id=ticket_id,
                    operation_type="response_draft",
                    model=self.model,
                    processing_status="fallback",
                    error_message=str(e),
                )

        # Grounded Fallback Template
        fallback_draft = self._generate_fallback_draft(author_name, subject, category, book_metadata)
        return {
            "draft_response": fallback_draft,
            "model_used": "grounded_policy_template",
            "status": "fallback",
            "retrieved_excerpts": [
                {"title": "BookLeaf Knowledge Base Policies", "category": category, "source": "official_bookleaf_policy", "score": 1.0}
            ]
        }

    def _generate_fallback_draft(
        self,
        author_name: str,
        subject: str,
        category: str,
        book_metadata: Optional[Dict[str, Any]]
    ) -> str:
        """Grounded fallback response template based on BookLeaf policies."""
        greeting = f"Dear {author_name},\n\nThank you for contacting BookLeaf Publishing. I understand your concern regarding \"{subject}\"."

        if category == "Royalty & Payments":
            body = (
                "Regarding your royalties, BookLeaf follows an 80/20 royalty split (80% net profit to the author). "
                "Royalties are calculated quarterly and disbursed within 45 days of the quarter ending, subject to the ₹1,000 "
                "minimum payout threshold. If accumulated royalties are below ₹1,000, they roll over to the subsequent quarter.\n\n"
                "I am reviewing your account figures and linked bank details to verify your latest payout schedule. "
                "Our team will follow up within 48 hours."
            )
        elif category == "ISBN & Metadata Issues":
            body = (
                "We treat ISBN discrepancies with the highest operational priority. Every BookLeaf title is assigned a unique ISBN "
                "registered under our publisher imprint. I have flagged this directly to our production team for immediate investigation, "
                "and we will have this corrected or updated within 48 hours."
            )
        elif category == "Printing & Quality":
            body = (
                "I sincerely apologize for the quality issues with your copies. BookLeaf guarantees complete satisfaction: "
                "for verified manufacturing defects such as misprints or binding issues, we arrange a 100% free reprint. "
                "Could you please share clear photographs showing the defect? Once verified, we will initiate a reprint with "
                "our standard 5–7 business days turnaround."
            )
        elif category == "Distribution & Availability":
            body = (
                "Thank you for notifying us. If your book appears unavailable on retail channels like Amazon or Flipkart, "
                "this is typically caused by an inventory stock synchronization feed issue. We are triggering an immediate catalog re-sync, "
                "which generally restores listing availability within 24 to 48 hours."
            )
        elif category == "Book Status & Production Updates":
            status_text = book_metadata.get('status', 'in production') if book_metadata else 'in production'
            body = (
                f"Your book is currently progressing through the {status_text} stage. Our team works carefully through "
                "Manuscript Review, Cover Design, Typesetting, and Proofreading to ensure top publishing quality. "
                "I am following up with your dedicated production coordinator and will send you an updated timeline shortly."
            )
        else:
            body = (
                "I am reviewing your query alongside our operations guidelines to ensure we provide you with the exact "
                "information and assistance you need. Our team will follow up with complete details shortly."
            )

        closing = "\n\nPlease let me know if you have any additional details to add in the meantime.\n\nWarm regards,\nBookLeaf Author Support Team"
        return f"{greeting}\n\n{body}\n\n{closing}"

ai_service = AIService()
