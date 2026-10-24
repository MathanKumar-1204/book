"""
BookLeaf Publishing - Core Constants, Enums, Knowledge Base, and Guidelines
Central configuration shared across backend routes, validation schemas, and AI prompts.
"""

from typing import List, Dict

# Exact 6 Ticket Categories
TICKET_CATEGORIES: List[str] = [
    "Royalty & Payments",
    "ISBN & Metadata Issues",
    "Printing & Quality",
    "Distribution & Availability",
    "Book Status & Production Updates",
    "General Inquiry",
]

# Exact 4 Priority Levels
TICKET_PRIORITIES: List[str] = [
    "Critical",
    "High",
    "Medium",
    "Low",
]

# Exact Ticket Statuses
TICKET_STATUSES: List[str] = [
    "Open",
    "In Progress",
    "Resolved",
    "Closed",
]

# Roles
ROLES: List[str] = [
    "author",
    "admin",
]

# Message Visibility
MESSAGE_VISIBILITIES: List[str] = [
    "public",
    "internal",
]

# Production Stages Pipeline
PRODUCTION_STAGES: List[str] = [
    "Manuscript Received",
    "Editing",
    "Cover Design",
    "Typesetting",
    "Proofreading",
    "ISBN Assignment",
    "Printing",
    "Distribution Setup",
    "Published & Live",
]

# Official BookLeaf Knowledge Base Documents (for Pinecone ingestion & offline fallback)
BOOKLEAF_KNOWLEDGE_BASE: List[Dict[str, str]] = [
    {
        "id": "kb-company-overview",
        "title": "Company Overview & Publishing Packages",
        "category": "General Inquiry",
        "content": (
            "BookLeaf Publishing is a leading self-publishing company operating in India and the US. "
            "We process over 1,200 books monthly across a catalog of 22,000+ titles. "
            "We offer two primary publishing packages: Standard Free (no upfront cost) and Bestseller Breakthrough "
            "(premium, paid package with specialized marketing and expanded distribution add-ons). "
            "We handle cover design, typesetting, ISBN assignment, printing, distribution, and royalty management. "
            "Our primary in-house printing facility and main fulfillment warehouse are located in Delhi. "
            "We also partner with Repro India and Epitome Books for overflow printing and specialized formats."
        ),
    },
    {
        "id": "kb-royalty-policy",
        "title": "Royalty Calculation, Thresholds, and Payment Schedule",
        "category": "Royalty & Payments",
        "content": (
            "BookLeaf operates on an 80/20 royalty split where 80% of the net profit per book goes to the author, "
            "and 20% goes to BookLeaf. Net profit is calculated strictly as: MRP minus printing cost, platform "
            "commissions (e.g., Amazon, Flipkart), and shipping charges. "
            "Royalties are calculated on a quarterly calendar cycle. Payouts are disbursed within 45 days of the "
            "quarter ending. The minimum payout threshold is ₹1,000. If accumulated royalties for a quarter are below "
            "₹1,000, the balance automatically rolls over to the subsequent quarter. Payouts are made exclusively via "
            "direct bank transfer to the account verified in the author's dashboard. Authors can inspect a complete, "
            "platform-by-platform royalty breakdown in their portal."
        ),
    },
    {
        "id": "kb-isbn-policy",
        "title": "ISBN Assignment and Imprint Guidelines",
        "category": "ISBN & Metadata Issues",
        "content": (
            "Every book published through BookLeaf Publishing receives a unique, registered ISBN assigned directly "
            "by BookLeaf. All standard ISBNs are registered under BookLeaf's official publisher imprint. If an author "
            "wishes to publish under their personal or separate imprint, they must independently purchase and register "
            "the ISBN with the relevant national agency before production starts. Any reported ISBN discrepancies "
            "(such as duplicate ISBNs, incorrect book mappings on retail platforms, or mismatched metadata) are treated "
            "as High-Priority operational defects and escalated directly to the production team with a standard 48-hour "
            "resolution window."
        ),
    },
    {
        "id": "kb-printing-quality",
        "title": "Printing Facilities, Turnaround Times, and Defect Handling",
        "category": "Printing & Quality",
        "content": (
            "Most print orders are handled by BookLeaf's in-house facility in Delhi. High-volume print runs or specialized "
            "hardcover/overflow formats may be routed to Repro India or Epitome Books. The standard print turnaround time "
            "is 5 to 7 business days from the date of order confirmation. If an author receives copies with confirmed "
            "manufacturing defects (including misprints, inverted pages, binding defects, or significant color inconsistency), "
            "BookLeaf arranges a completely free reprint after defect verification. The author must provide clear photographs "
            "of the defective copies for verification. Free reprints are processed within 5 to 7 business days."
        ),
    },
    {
        "id": "kb-distribution-availability",
        "title": "Retail Distribution Channels and Inventory Synchronization",
        "category": "Distribution & Availability",
        "content": (
            "BookLeaf distributes titles across Amazon India, Flipkart, Amazon US, Amazon UK, and the direct BookLeaf Store. "
            "Once publication is completed, new listings typically propagate and go live across all retail channels within "
            "7 to 10 business days. If a published book is displayed as 'Currently Unavailable' or 'Out of Stock' on Amazon "
            "or Flipkart, this usually signifies an automated inventory feed or stock synchronization issue. BookLeaf's "
            "operations team triggers an immediate catalog re-sync, which typically restores availability within 24 to 48 hours."
        ),
    },
    {
        "id": "kb-production-stages",
        "title": "Book Production Pipeline and Milestones",
        "category": "Book Status & Production Updates",
        "content": (
            "Every BookLeaf title progresses through 9 sequential production stages: "
            "1. Manuscript Received -> 2. Editing (if package opted) -> 3. Cover Design -> 4. Typesetting -> "
            "5. Proofreading -> 6. ISBN Assignment -> 7. Printing -> 8. Distribution Setup -> 9. Published & Live. "
            "Authors receive automated email notifications at each milestone. Common bottlenecks occur during Cover Design "
            "(awaiting author approval of concepts) and Proofreading (revision and correction cycles). Authors can review "
            "their real-time stage progress directly within the BookLeaf author portal."
        ),
    },
    {
        "id": "kb-metadata-updates",
        "title": "Post-Publication Metadata and Blurb Updates",
        "category": "General Inquiry",
        "content": (
            "Authors can update book descriptions, author biographies, keywords, and promotional blurbs after publication. "
            "Requests can be submitted directly through the support portal. Once submitted, metadata updates are reviewed "
            "and pushed to Amazon and Flipkart feeds. Changes typically reflect on retail platforms within 3 to 5 business days."
        ),
    },
]

# Official Communication Tone Guidelines
COMMUNICATION_GUIDELINES: str = """
Tone and Style Standards:
1. Empathetic and Professional: Treat authors as valued creative partners, not support tickets.
2. Acknowledge First: Always validate the author's concern and emotion before proposing solutions.
3. Be Specific: Quote exact figures, dates, ISBNs, and production statuses whenever available from the database. Avoid vague statements.
4. Radical Ownership: If BookLeaf caused a delay or mistake (e.g. printing defect, royalty delay, wrong ISBN), apologize sincerely and take full responsibility without corporate deflection.
5. Realistic Commitments: Never invent actions that have not occurred (e.g. do NOT say 'we have refunded your account' unless recorded in DB). Provide standard policy timelines (e.g., 24-48 hours for stock re-sync, 48 hours for ISBN investigation, 5-7 business days for reprint).
6. Clear Next Steps: Always conclude with an actionable next step for the author or the BookLeaf operations team.
"""
