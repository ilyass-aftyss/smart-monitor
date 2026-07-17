#!/bin/bash
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     Smart Environmental Monitoring Platform — Démarrage     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "▶ Démarrage des services Docker..."
docker-compose up -d

echo ""
echo "⏳ Attente du démarrage des services (30s)..."
sleep 30

echo ""
echo "✅ Application disponible sur : http://localhost:3000"
echo "📊 API Swagger sur           : http://localhost:8000/docs"
echo ""
echo "Identifiants par défaut :"
echo "  admin / admin   → accès complet"
echo "  viewer / admin  → consultation"
echo ""
echo "Pour voir les logs : docker-compose logs -f"
echo "Pour arrêter       : docker-compose down"
