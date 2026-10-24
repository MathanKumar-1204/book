"""
BookLeaf Publishing - Pydantic Validation Schemas
Validates request payloads and formats outgoing API responses.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
from app.constants import TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES, MESSAGE_VISIBILITIES

class TicketCreateSchema(BaseModel):
    subject: str = Field(..., min_length=3, max_length=200, description="Ticket subject line")
    description: str = Field(..., min_length=10, max_length=5000, description="Detailed explanation of the issue")
    book_id: Optional[str] = Field(None, description="Optional ID of the associated book, or null for general inquiry")
    category: Optional[str] = Field(None, description="Optional author-suggested category")

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in TICKET_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(TICKET_CATEGORIES)}")
        return v

class TicketUpdateSchema(BaseModel):
    status: Optional[str] = Field(None, description="Updated ticket status")
    category: Optional[str] = Field(None, description="Admin overridden category")
    priority: Optional[str] = Field(None, description="Admin overridden priority")
    assigned_admin_id: Optional[str] = Field(None, description="UUID of admin to assign")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in TICKET_STATUSES:
            raise ValueError(f"Status must be one of: {', '.join(TICKET_STATUSES)}")
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in TICKET_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(TICKET_CATEGORIES)}")
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in TICKET_PRIORITIES:
            raise ValueError(f"Priority must be one of: {', '.join(TICKET_PRIORITIES)}")
        return v

class TicketMessageCreateSchema(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000, description="Message content")
    visibility: Optional[str] = Field("public", description="'public' (author-facing) or 'internal' (admin-only)")

    @field_validator("visibility")
    @classmethod
    def validate_visibility(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in MESSAGE_VISIBILITIES:
            raise ValueError(f"Visibility must be one of: {', '.join(MESSAGE_VISIBILITIES)}")
        return v

class InternalNoteCreateSchema(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000, description="Internal admin note content")

class AIClassificationResult(BaseModel):
    category: str = Field(..., description="Classified category")
    priority: str = Field(..., description="Assigned priority score")
    reason: str = Field(..., description="Justification for classification")
    confidence: float = Field(0.9, ge=0.0, le=1.0, description="Confidence score")

    @field_validator("category")
    @classmethod
    def validate_cat(cls, v: str) -> str:
        if v not in TICKET_CATEGORIES:
            raise ValueError(f"Invalid category: {v}")
        return v

    @field_validator("priority")
    @classmethod
    def validate_prio(cls, v: str) -> str:
        if v not in TICKET_PRIORITIES:
            raise ValueError(f"Invalid priority: {v}")
        return v

class AIDraftResponseResult(BaseModel):
    draft_response: str = Field(..., min_length=10, description="AI suggested author response")
    retrieved_excerpts: List[Dict[str, Any]] = Field(default_factory=list, description="Knowledge base chunks used")
    model_used: str = Field(..., description="Model identifier used")
