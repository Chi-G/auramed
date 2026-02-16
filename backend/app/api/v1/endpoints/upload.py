from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
from pathlib import Path
from typing import Any
from app.core.config import settings

router = APIRouter()

UPLOAD_DIR = Path("static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/", response_model=dict)
async def upload_file(
    file: UploadFile = File(...)
) -> Any:
    """
    Upload a file.
    """
    try:
        # Create a unique filename or use original
        # For simplicity using original but prepending timestamp could be better
        # or using UUID.
        import uuid
        file_extension = os.path.splitext(file.filename)[1]
        new_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / new_filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return the URL. configured to be served at /static/uploads
        # We need to return the full URL or relative path depending on frontend needs
        # Let's return relative path for flexibility.
        # Assuming app mounts /static
        
        return {"url": f"/static/uploads/{new_filename}"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not upload file: {str(e)}")
