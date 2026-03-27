from app import create_app
from extensions import db
from models import Scheme, User
import os

app = create_app()
with app.app_context():
    schemes = Scheme.query.all()
    print(f"Total schemes: {len(schemes)}")
    for s in schemes:
        print(f"- {s.name} (Active: {s.is_active})")
    
    admin = User.query.filter_by(username='admin').first()
    print(f"Admin user exists: {admin is not None}")
    if admin:
        print(f"Admin role: {admin.role}")
