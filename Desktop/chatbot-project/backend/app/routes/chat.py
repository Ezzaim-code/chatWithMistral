from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.database import get_db
from app.schemas import ChatMessage, ChatResponse, MessageResponse
from app.models import Conversation, Message
from app.services.claude_service import ClaudeService

router = APIRouter()
claude_service = ClaudeService()

@router.post("/message", response_model=ChatResponse)
async def send_message(chat_request: ChatMessage, db: Session = Depends(get_db)):
    try:
        # Obtenir ou créer session
        session_id = chat_request.session_id or str(uuid.uuid4())
        
        conversation = db.query(Conversation).filter(
            Conversation.session_id == session_id
        ).first()
        
        if not conversation:
            conversation = Conversation(
                session_id=session_id,
                title=chat_request.message[:50]
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
        
        # Sauvegarder message utilisateur
        user_message = Message(
            conversation_id=conversation.id,
            role="user",
            content=chat_request.message
        )
        db.add(user_message)
        db.commit()
        
        # Générer réponse
        response = await claude_service.generate_response(chat_request.message)
        
        if not response["success"]:
            raise HTTPException(status_code=500, detail="Erreur IA")
        
        # Sauvegarder réponse
        assistant_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=response["reply"]
        )
        db.add(assistant_message)
        conversation.updated_at = datetime.utcnow()
        db.commit()
        
        return ChatResponse(
            reply=response["reply"],
            session_id=session_id,
            conversation_id=str(conversation.id),
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{session_id}")
async def get_history(session_id: str, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter(
        Conversation.session_id == session_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Non trouvé")
    
    messages = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at).all()
    
    return messages