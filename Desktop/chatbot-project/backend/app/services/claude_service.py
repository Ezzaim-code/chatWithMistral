import google.generativeai as genai
import traceback
from app.config import settings
import logging


logger = logging.getLogger(__name__)

class ClaudeService:
    """Service IA - Utilise Gemini (Google)"""
    
    def __init__(self):
        # Configurer Gemini avec les paramètres de config
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # Utiliser le modèle défini dans config
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
        
        logger.info(f"✅ Service IA initialisé avec Gemini: {settings.GEMINI_MODEL}")
    
    async def generate_response(self, user_message: str, context: str = "") -> dict:
        """Générer une réponse avec Gemini"""
        
        try:
            # Créer le prompt système
            system_prompt = """Tu es un assistant virtuel intelligent et serviable.

INSTRUCTIONS:
- Réponds de manière précise et concise en français
- Sois professionnel et courtois
- Si tu ne sais pas, dis-le honnêtement
- Adapte ton niveau de langage à la question"""

            # Ajouter contexte si disponible
            if context:
                system_prompt += f"\n\nCONTEXTE DISPONIBLE:\n{context}"
            
            # Construire le prompt complet
            full_prompt = f"""{system_prompt}

Question de l'utilisateur: {user_message}

Réponse:"""
            
            # Configuration de génération depuis settings
            generation_config = genai.types.GenerationConfig(
                temperature=settings.GEMINI_TEMPERATURE,
                max_output_tokens=settings.GEMINI_MAX_TOKENS,
                top_p=0.9,
                top_k=40
            )
            
            # Appeler Gemini
            response = self.model.generate_content(
                full_prompt,
                generation_config=generation_config
            )
            
            # Extraire la réponse
            reply = response.text
            
            logger.info(f"✅ Réponse générée avec succès (modèle: {settings.GEMINI_MODEL})")
            
            return {
                "success": True,
                "reply": reply,
                "model": settings.GEMINI_MODEL
            }
            
        except Exception as e:
            logger.error(f"❌ Erreur Gemini: {e}")
            return {
                "success": False,
                "reply": "Désolé, une erreur est survenue. Veuillez réessayer.",
                "error": str(e)
            }