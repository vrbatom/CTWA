const express = require('express');
// Moderní importy pro firebase-admin v14+
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

// Bezpečné načtení a vyčištění privátního klíče
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
  : undefined;

// Zkontrolujeme pomocí moderní funkce getApps(), zda už aplikace nebyla spuštěna
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    })
  });
}

// Získání databáze moderním způsobem
const db = getFirestore();
const collection = db.collection('inzeraty');

// NAČTENÍ INZERÁTŮ
app.get('/api/inzeraty', async (req, res) => {
  try {
    const snapshot = await collection.get();
    const inzeraty = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(inzeraty);
  } catch (error) {
    console.error("Chyba při GET:", error);
    res.status(500).json({ error: 'Chyba při načítání databáze' });
  }
});

// PŘIDÁNÍ INZERÁTU
app.post('/api/inzeraty', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'Chybí data' });

    const docRef = await collection.add({ title, description, createdAt: new Date().toISOString() });
    res.status(201).json({ id: docRef.id, title, description });
  } catch (error) {
    console.error("Chyba při POST:", error);
    res.status(500).json({ error: 'Chyba při ukládání' });
  }
});

// ÚPRAVA INZERÁTU
app.put('/api/inzeraty/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    await collection.doc(id).update({ title, description });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Chyba při PUT:", error);
    res.status(500).json({ error: 'Chyba při úpravě' });
  }
});

// SMAZÁNÍ INZERÁTU
app.delete('/api/inzeraty/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await collection.doc(id).delete();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Chyba při DELETE:", error);
    res.status(500).json({ error: 'Chyba při mazání' });
  }
});

module.exports = app;