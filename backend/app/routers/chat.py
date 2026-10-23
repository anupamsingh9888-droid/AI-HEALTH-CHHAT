import logging
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse, ChatHistoryResponse
from app.services.supabase_service import get_supabase_service
from app.services.gemini_service import get_gemini_service
from app.utils.security import get_current_user, AuthenticatedUser

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["AI Health Chat"])


@router.post("", response_model=ChatMessageResponse)
async def send_chat_message(
    body: ChatMessageRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Sends a message to the AI Health Copilot assistant.
    Uses user health profile and recent reports for context when requested.
    """
    supabase = get_supabase_service()
    gemini = get_gemini_service()

    # Step 1: Save User message
    user_record = supabase.save_chat_message(
        user_id=current_user.id,
        role="user",
        content=body.message,
    )

    # Step 2: Fetch context if requested
    user_profile = None
    recent_reports = None
    if body.include_health_context:
        user_profile = supabase.get_profile(current_user.id)
        recent_reports = supabase.get_reports(current_user.id)

    # Step 3: Fetch recent conversation history
    history = supabase.get_chat_history(current_user.id, limit=6)

    # Step 4: Generate response from Gemini
    reply_data = await gemini.generate_chat_reply(
        user_message=body.message,
        conversation_history=history,
        user_profile=user_profile,
        recent_reports=recent_reports,
    )

    # Step 5: Save AI assistant reply
    assistant_record = supabase.save_chat_message(
        user_id=current_user.id,
        role="assistant",
        content=reply_data["content"],
        suggestions=reply_data.get("suggestions", []),
    )

    return ChatMessageResponse(
        id=assistant_record["id"],
        role="assistant",
        content=assistant_record["content"],
        suggestions=assistant_record.get("suggestions", []),
        created_at=assistant_record["created_at"],
    )


@router.get("/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Retrieves the user's conversation history with the health assistant.
    """
    supabase = get_supabase_service()
    messages = supabase.get_chat_history(current_user.id, limit=50)
    formatted = [
        ChatMessageResponse(
            id=m["id"],
            role=m["role"],
            content=m["content"],
            suggestions=m.get("suggestions", []),
            created_at=m.get("created_at"),
        )
        for m in messages
    ]
    return ChatHistoryResponse(messages=formatted, total=len(formatted))


@router.delete("/history")
async def clear_chat_history(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Clears all chat history for the authenticated user.
    """
    supabase = get_supabase_service()
    supabase.clear_chat_history(current_user.id)
    return {"message": "Chat history cleared successfully"}
