
import ChatService from "./chatservice.js";

export function initSuperChat() {
  // Encerra listeners de uma inicialização anterior
  window.omdaChatUsersUnsub?.();
  window.omdaChatMessagesUnsub?.();
  window.omdaChatConversationsUnsub?.();

  window.omdaChatUsersUnsub = null;
  window.omdaChatMessagesUnsub = null;
  window.omdaChatConversationsUnsub = null;

  const usersList = document.getElementById("chat-users-list");
  const usersCount = document.getElementById("chat-users-count");
  const conversationsList = document.getElementById(
    "chat-conversations-placeholder"
  );

  const modal = document.getElementById("omda-chat-modal");
  const closeButton = document.getElementById("omda-chat-close");
  const title = document.getElementById("omda-chat-title");
  const chatStatus = document.getElementById("omda-chat-status");
  const messages = document.getElementById("omda-chat-messages");
  const form = document.getElementById("omda-chat-form");
  const input = document.getElementById("omda-chat-input");
  const sendButton = document.getElementById("omda-chat-send");
  const feedback = document.getElementById("omda-chat-feedback");

  if (
    !usersList ||
    !conversationsList ||
    !modal ||
    !closeButton ||
    !title ||
    !chatStatus ||
    !messages ||
    !form ||
    !input ||
    !sendButton
  ) {
    console.error("SuperChat: elementos HTML não encontrados.");
    return;
  }

  const currentUser = ChatService.getCurrentUser();

  if (!currentUser) {
    if (usersCount) usersCount.textContent = "Faça login para continuar.";
    return;
  }

  let selectedUser = null;
  let conversationId = null;
  let usersCache = [];
  let conversationsCache = [];
  let openingToken = 0;
  let initializedConversations = false;
  let previousLastMessages = {};
  let unreadByConversation = {};
  let audioContext = null;

  const allowedRoles = ["ops", "adm"];

  function isAllowed(user) {
    return allowedRoles.includes(user?.role);
  }

  function getOtherUid(conversation) {
    return conversation.participants?.find(
      uid => uid !== currentUser.uid
    );
  }

  function getOtherUser(conversation) {
    const uid = getOtherUid(conversation);

    return usersCache.find(user => user.uid === uid) || {
      uid,
      name: conversation.participantNames?.[uid] || "Usuário",
      role: ""
    };
  }

  function setFeedback(message, error = false) {
    if (!feedback) return;

    feedback.textContent = message;
    feedback.className = error
      ? "mt-2 min-h-4 text-xs text-red-400"
      : "mt-2 min-h-4 text-xs text-[#8A8A8A]";
  }

  function showError(error) {
    console.error("SuperChat:", error);

    const message =
      error?.code === "permission-denied"
        ? "Acesso negado pelas regras do Firestore."
        : error?.message || "Não foi possível carregar o chat.";

    chatStatus.textContent = message;
    setFeedback(message, true);
  }

  function playNotification() {
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) return;

      audioContext ||= new AudioContextClass();

      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.value = 0.06;

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.12);
    } catch (error) {
      console.warn("Som indisponível:", error);
    }
  }

  function notifyMessage(name, text) {
    playNotification();

    if (
      document.hidden &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification("OMDA · Nova mensagem", {
        body: `${name}: ${text}`
      });
    }
  }

  function openModal() {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    if (window.lucide) window.lucide.createIcons();
  }

  function closeModal() {
    openingToken++;

    window.omdaChatMessagesUnsub?.();
    window.omdaChatMessagesUnsub = null;

    conversationId = null;
    selectedUser = null;

    modal.classList.add("hidden");
    modal.classList.remove("flex");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    input.value = "";
    input.disabled = true;
    sendButton.disabled = true;

    messages.replaceChildren();

    const empty = document.createElement("p");
    empty.className = "m-auto text-center text-sm text-[#8A8A8A]";
    empty.textContent = "Selecione uma conversa para começar.";
    messages.appendChild(empty);
  }

  function renderMessages(items) {
    messages.replaceChildren();

    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "m-auto text-center text-sm text-[#8A8A8A]";
      empty.textContent = "Envie a primeira mensagem.";
      messages.appendChild(empty);
      return;
    }

    for (const item of items) {
      const mine = item.senderId === currentUser.uid;
      const bubble = document.createElement("div");

      bubble.className = mine
        ? "ml-auto max-w-[85%] rounded-2xl bg-[#5864be] px-4 py-3 text-sm text-white"
        : "mr-auto max-w-[85%] rounded-2xl border border-[#242424] bg-[#050505] px-4 py-3 text-sm text-white";

      const text = document.createElement("p");
      text.className = "whitespace-pre-wrap break-words";
      text.textContent = item.text || "";

      const time = document.createElement("p");
      time.className = "mt-1 text-right text-[10px] opacity-70";
      time.textContent = item.createdAt?.toDate
        ? item.createdAt.toDate().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit"
          })
        : "Enviando...";

      bubble.append(text, time);
      messages.appendChild(bubble);
    }

    messages.scrollTop = messages.scrollHeight;
  }

  async function openConversation(user, existingId = null) {
    if (!isAllowed(user) || !user.uid || user.uid === currentUser.uid) {
      showError(new Error("Somente usuários ops e adm podem conversar."));
      return;
    }

    const token = ++openingToken;

    window.omdaChatMessagesUnsub?.();
    window.omdaChatMessagesUnsub = null;

    selectedUser = user;
    conversationId = null;

    title.textContent = user.name || user.email || "Usuário";
    chatStatus.textContent = "Abrindo conversa...";
    messages.replaceChildren();

    input.disabled = true;
    sendButton.disabled = true;

    setFeedback("");
    openModal();

    try {
      const id = existingId || await ChatService.createConversation(user);

      // Impede que uma abertura anterior substitua a conversa atual
      if (token !== openingToken) return;

      conversationId = id;
      unreadByConversation[id] = 0;

      chatStatus.textContent = `Conversa privada · ${user.role.toUpperCase() || "Equipe"}`;
      input.disabled = false;
      sendButton.disabled = false;

      renderConversations();

      window.omdaChatMessagesUnsub = ChatService.listenMessages(
        id,
        items => {
          if (token !== openingToken || conversationId !== id) return;

          const last = items[items.length - 1];
          const previousId = previousLastMessages[id];

          if (
            last &&
            previousId &&
            last.id !== previousId &&
            last.senderId !== currentUser.uid
          ) {
            notifyMessage(user.name || "Equipe", last.text || "Nova mensagem");
          }

          if (last) previousLastMessages[id] = last.id;

          unreadByConversation[id] = 0;
          renderMessages(items);
          renderConversations();
        },
        showError
      );

      input.focus();
    } catch (error) {
      if (token === openingToken) showError(error);
    }
  }

  function renderConversations() {
    conversationsList.replaceChildren();

    const eligible = conversationsCache.filter(conversation => {
      const otherUid = getOtherUid(conversation);
      const otherUser = usersCache.find(user => user.uid === otherUid);

      return (
        otherUid &&
        (isAllowed(otherUser) ||
          allowedRoles.includes(
            conversation.participantRoles?.[otherUid]
          ))
      );
    });

    if (!eligible.length) {
      const empty = document.createElement("p");
      empty.className = "p-3 text-xs text-[#8A8A8A]";
      empty.textContent = "Nenhuma conversa com ops ou adm.";
      conversationsList.appendChild(empty);
      return;
    }

    for (const conversation of eligible) {
      const user = getOtherUser(conversation);
      const button = document.createElement("button");

      button.type = "button";
      button.className =
        "flex w-full items-center gap-3 rounded-xl border border-[#242424] bg-[#101010] p-3 text-left transition hover:border-[#5864be]";

      const avatar = document.createElement("span");
      avatar.className =
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#252525] text-sm font-semibold";
      avatar.textContent = (user.name || "?").charAt(0).toUpperCase();

      const info = document.createElement("span");
      info.className = "min-w-0 flex-1";

      const name = document.createElement("span");
      name.className = "block truncate text-sm font-medium";
      name.textContent = user.name || "Usuário";

      const preview = document.createElement("span");
      preview.className = "mt-1 block truncate text-xs text-[#8A8A8A]";
      preview.textContent = conversation.lastMessage
        ? `${conversation.lastSenderId === currentUser.uid ? "Você: " : ""}${conversation.lastMessage}`
        : "Iniciar conversa";

      info.append(name, preview);
      button.append(avatar, info);

      const unread = unreadByConversation[conversation.id] || 0;

      if (unread) {
        const badge = document.createElement("span");
        badge.className =
          "rounded-full bg-[#5864be] px-2 py-1 text-xs font-bold";
        badge.textContent = unread;
        button.appendChild(badge);
      }

      if (conversation.id === conversationId) {
        button.classList.add("border-[#5864be]");
      }

      button.addEventListener("click", () =>
        openConversation(user, conversation.id)
      );

      conversationsList.appendChild(button);
    }
  }

  function renderUsers() {
    usersList.replaceChildren();

    const eligible = usersCache.filter(
      user => isAllowed(user) && user.uid !== currentUser.uid
    );

    if (usersCount) {
      usersCount.textContent = `${eligible.length} usuário(s) autorizado(s)`;
    }

    if (!eligible.length) {
      const empty = document.createElement("p");
      empty.className = "p-4 text-xs text-[#8A8A8A]";
      empty.textContent = "Nenhum usuário ops ou adm encontrado.";
      usersList.appendChild(empty);
      return;
    }

    for (const user of eligible) {
      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "flex w-full items-center gap-3 rounded-xl border border-[#242424] bg-[#101010] p-3 text-left transition hover:border-[#5864be]";

      const avatar = document.createElement("span");
      avatar.className =
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#252525] text-sm font-semibold";
      avatar.textContent = (user.name || user.email || "?")
        .charAt(0)
        .toUpperCase();

      const info = document.createElement("span");
      info.className = "min-w-0 flex-1";

      const name = document.createElement("span");
      name.className = "block truncate text-sm font-medium";
      name.textContent = user.name || user.email || "Usuário";

      const role = document.createElement("span");
      role.className = "mt-1 block text-xs text-[#8A8A8A]";
      role.textContent = user.role.toUpperCase();

      info.append(name, role);
      button.append(avatar, info);

      const icon = document.createElement("span");
      icon.setAttribute("data-lucide", "message-circle");
      icon.className = "h-4 w-4 shrink-0 text-[#5864be]";
      button.appendChild(icon);

      button.addEventListener("click", () => openConversation(user));
      usersList.appendChild(button);
    }

    if (window.lucide) window.lucide.createIcons();
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const text = input.value.trim();
    const activeConversation = conversationId;

    if (!text || !activeConversation || !selectedUser) return;

    input.disabled = true;
    sendButton.disabled = true;
    setFeedback("Enviando...");

    try {
      await ChatService.sendMessage(activeConversation, text);

      if (conversationId === activeConversation) {
        input.value = "";
        setFeedback("");
      }
    } catch (error) {
      showError(error);
    } finally {
      if (conversationId === activeConversation) {
        input.disabled = false;
        sendButton.disabled = false;
        input.focus();
      }
    }
  });

  closeButton.addEventListener("click", closeModal);

  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });

  window.omdaChatUsersUnsub = ChatService.listenUsers(
    users => {
      usersCache = users.filter(isAllowed);
      renderUsers();
      renderConversations();
    },
    showError
  );

  window.omdaChatConversationsUnsub = ChatService.listenConversations(
    conversations => {
      conversationsCache = conversations;

      for (const conversation of conversations) {
        const lastId = conversation.lastMessage
          ? `${conversation.lastSenderId || ""}:${conversation.updatedAt?.toMillis?.() || conversation.lastMessage}`
          : null;

        const previousId = previousLastMessages[conversation.id];

        if (
          initializedConversations &&
          lastId &&
          previousId &&
          lastId !== previousId &&
          conversation.lastSenderId !== currentUser.uid &&
          conversation.id !== conversationId
        ) {
          unreadByConversation[conversation.id] =
            (unreadByConversation[conversation.id] || 0) + 1;

          const otherUser = getOtherUser(conversation);
          notifyMessage(
            otherUser.name || "Equipe",
            conversation.lastMessage || "Nova mensagem"
          );
        }

        if (lastId) previousLastMessages[conversation.id] = lastId;
      }

      initializedConversations = true;
      renderConversations();
    },
    showError
  );

  if ("Notification" in window && Notification.permission === "default") {
    // A permissão só é solicitada após ação explícita.
    const notificationButton = document.createElement("button");
    notificationButton.type = "button";
    notificationButton.className =
      "mt-2 text-xs text-[#8A8A8A] underline hover:text-white";
    notificationButton.textContent = "Ativar notificações do navegador";

    notificationButton.addEventListener("click", async () => {
      try {
        const permission = await Notification.requestPermission();

        notificationButton.remove();

        if (permission === "granted") {
          setFeedback("Notificações do navegador ativadas.");
        }
      } catch (error) {
        console.warn("Permissão de notificações indisponível:", error);
      }
    });

    usersList.parentElement.appendChild(notificationButton);
  }

  window.omdaChatClose = closeModal;

  if (window.lucide) window.lucide.createIcons();
}
