const express = require('express');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Načte klíče ze souboru .env (nebo z nastavení na Vercelu)
dotenv.config();

const app = express();
// Umožní serveru číst data zaslaná z formuláře ve formátu JSON
app.use(express.json());

// Bezpečná inicializace Firebase pouze v případě, že ještě nebyla spuštěna
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Nahrazuje znaky pro nové řádky, aby Vercel klíč správně přečetl:
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    })
  });
}

const db = admin.firestore();
const collection = db.collection('inzeraty');

// --- ENDPOINTY (Cesty API) ---

// 1. ČTENÍ (GET /api/inzeraty) - pošle všechny inzeráty na web
app.get('/api/inzeraty', async (req, res) => {
  try {
    const snapshot = await collection.get();
    const inzeraty = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(inzeraty);
  } catch (error) {
    console.error("Chyba čtení:", error);
    res.status(500).json({ error: 'Chyba při načítání z databáze' });
  }
});

// 2. PŘIDÁNÍ (POST /api/inzeraty) - uloží nový inzerát z formuláře
app.post('/api/inzeraty', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'Chybí název nebo popis' });

    const docRef = await collection.add({ 
      title, 
      description, 
      createdAt: new Date().toISOString() 
    });
    res.status(201).json({ id: docRef.id, title, description });
  } catch (error) {
    console.error("Chyba ukládání:", error);
    res.status(500).json({ error: 'Chyba při ukládání' });
  }
});

// 3. ÚPRAVA (PUT /api/inzeraty/:id) - upraví existující inzerát podle ID
app.put('/api/inzeraty/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    await collection.doc(id).update({ title, description });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Chyba úpravy:", error);
    res.status(500).json({ error: 'Chyba při úpravě' });
  }
});

// 4. MAZÁNÍ (DELETE /api/inzeraty/:id) - smaže inzerát podle ID
app.delete('/api/inzeraty/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await collection.doc(id).delete();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Chyba mazání:", error);
    res.status(500).json({ error: 'Chyba při mazání' });
  }
});

// Export pro Vercel (nespouštíme zde app.listen jako u běžného Node.js)
module.exports = app;