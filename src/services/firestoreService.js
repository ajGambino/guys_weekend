import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const addPlayer = async (player) => {
  try {
    await addDoc(collection(db, 'players'), player);
  } catch (e) {
    console.error('Error adding document: ', e);
  }
};

const getPlayers = async () => {
  const players = [];
  const q = query(collection(db, 'players'));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    players.push({ id: doc.id, ...doc.data() });
  });
  return players;
};

export { addPlayer, getPlayers };
