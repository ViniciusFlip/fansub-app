 
// hub/services/notification.service.js

import {
    addDoc,
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../firebase/config.js";
import { onUserAuthenticated } from "./sessionService.js";

const notificationsRef = collection(db, "notifications");
const allowedRoles = ["adm", "ops"];

// CREATE
export async function createNotification(user, notification = {}) {
    if (!user?.uid) throw new Error("Usuário inválido.");

    if (!allowedRoles.includes(user.role)) return null;

    return addDoc(notificationsRef, {
        type: notification.type || "system",
        title: notification.title || "Notificação",
        message: notification.message || "Nova notificação.",
        userId: user.uid,
        userName: user.name || user.email || "Usuário",
        userRole: user.role,
        read: false,
        createdAt: serverTimestamp()
    });
}

// READ: acompanha notificações em tempo real
export function listenNotifications(callback, onError = console.error) {
    const q = query(
        notificationsRef,
        orderBy("createdAt", "desc"),
        limit(50)
    );

    return onSnapshot(q, callback, onError);
}

// UPDATE: marca como lida
export async function markNotificationAsRead(notificationId) {
    if (!notificationId) throw new Error("ID da notificação obrigatório.");

    await updateDoc(doc(db, "notifications", notificationId), {
        read: true
    });
}

// DELETE
export async function deleteNotification(notificationId) {
    if (!notificationId) throw new Error("ID da notificação obrigatório.");

    await deleteDoc(doc(db, "notifications", notificationId));
}

// TESTE: cria uma notificação real no Firestore
export async function testNotification(user) {
    return createNotification(user, {
        type: "test",
        title: "Teste de notificação",
        message: "O serviço de notificações está funcionando."
    });
}

// LOGIN: gera notificação para adm e ops
onUserAuthenticated(async (user) => {
    if (!allowedRoles.includes(user?.role)) return;

    await createNotification(user, {
        type: "login",
        title: "Novo login administrativo",
        message: `${user.name || user.email || "Usuário"} entrou no sistema.`
    });
});
 