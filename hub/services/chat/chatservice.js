
import {
  collection,
  doc,
  addDoc,
  setDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db, auth } from "../../firebase/config.js";

const ChatService = {
  getCurrentUser() {
    return auth.currentUser;
  },

  listenUsers(callback, onError) {
    const q = query(
      collection(db, "users"),
      where("active", "==", true)
    );

    return onSnapshot(q, snapshot => {
      const users = snapshot.docs
        .map(item => ({ id: item.id, ...item.data() }))
        .filter(user => user.uid !== auth.currentUser?.uid);

      callback(users);
    }, onError);
  },

  listenConversations(callback, onError) {
    const user = auth.currentUser;
    if (!user) {
      onError?.(new Error("Faça login para ver suas conversas."));
      return () => {};
    }

    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid)
    );

    return onSnapshot(q, snapshot => {
      const conversations = snapshot.docs
        .map(item => ({ id: item.id, ...item.data() }))
        .sort((a, b) =>
          (b.updatedAt?.toMillis?.() || 0) -
          (a.updatedAt?.toMillis?.() || 0)
        );

      callback(conversations);
    }, onError);
  },

  async createConversation(otherUser) {
    const currentUser = auth.currentUser;

    if (!currentUser) throw new Error("Faça login primeiro.");
    if (!otherUser?.uid || otherUser.uid === currentUser.uid) {
      throw new Error("Destinatário inválido.");
    }

    const participants = [currentUser.uid, otherUser.uid].sort();
    const conversationId = participants.join("_");

    await setDoc(doc(db, "conversations", conversationId), {
      participants,
      participantNames: {
        [currentUser.uid]:
          currentUser.displayName || currentUser.email || "Usuário",
        [otherUser.uid]:
          otherUser.name || otherUser.email || "Usuário"
      },
      updatedAt: serverTimestamp()
    }, { merge: true });

    return conversationId;
  },

  listenMessages(conversationId, callback, onError) {
    return onSnapshot(
      collection(db, "conversations", conversationId, "messages"),
      snapshot => {
        const messages = snapshot.docs
          .map(item => ({ id: item.id, ...item.data() }))
          .sort((a, b) =>
            (a.createdAt?.toMillis?.() || 0) -
            (b.createdAt?.toMillis?.() || 0)
          );

        callback(messages);
      },
      onError
    );
  },

  async sendMessage(conversationId, text) {
    const user = auth.currentUser;
    const message = text.trim();

    if (!user) throw new Error("Usuário não autenticado.");
    if (!conversationId) throw new Error("Abra uma conversa.");
    if (!message) return;

    const conversationRef = doc(db, "conversations", conversationId);

    await addDoc(collection(conversationRef, "messages"), {
      text: message,
      senderId: user.uid,
      createdAt: serverTimestamp()
    });

    await setDoc(conversationRef, {
      lastMessage: message,
      lastSenderId: user.uid,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
};

export default ChatService;