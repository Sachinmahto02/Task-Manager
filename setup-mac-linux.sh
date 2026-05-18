#!/bin/bash
echo "============================================"
echo "  ZenFlow - Smart Journal Setup (Mac/Linux)"
echo "============================================"
echo ""

echo "[1/2] Installing Backend dependencies..."
cd backend && npm install
echo "Backend ready!"
echo ""

echo "[2/2] Installing Frontend dependencies..."
cd ../frontend && npm install
echo "Frontend ready!"
echo ""

echo "============================================"
echo " SETUP COMPLETE!"
echo "============================================"
echo ""
echo "To start the app:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd backend && npm run dev"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd frontend && npm start"
echo ""
echo "Make sure MongoDB is running first!"
echo "  brew services start mongodb-community"
echo "============================================"
