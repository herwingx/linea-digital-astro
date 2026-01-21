// src/lib/chatbot-client.ts

/**
 * Representa un único mensaje en el historial del chat.
 */
interface Message {
  /** El rol de quien envía el mensaje. */
  role: 'user' | 'bot';
  /** El contenido de texto del mensaje. */
  content: string;
  /** La fecha y hora en que se creó el mensaje. */
  timestamp: Date;
}

/**
 * Agrupa todas las referencias a los elementos del DOM que utiliza el chatbot.
 */
interface ChatbotElements {
  container: HTMLElement;
  fab: HTMLButtonElement;
  window: HTMLElement;
  messages: HTMLElement;
  input: HTMLInputElement;
  form: HTMLFormElement;
  quickReplies: HTMLElement;
  badge: HTMLElement;
  sendBtn: HTMLButtonElement;
  minimizeBtn: HTMLButtonElement;
  resetBtn: HTMLButtonElement;
  callout: HTMLElement;
}

/**
 * Manages the entire state and interaction logic for the chatbot UI.
 * This class is responsible for DOM manipulation, event handling,
 * and communication with the chat API.
 */
export class ChatbotClient {
  /** Referencias a los elementos del DOM utilizados por el chatbot. */
  private elements!: ChatbotElements;
  /** Almacena el historial de la conversación actual. */
  private history: Message[] = [];
  /** Estado que indica si la ventana del chat está abierta o cerrada. */
  private isOpen = false;
  /** Estado que indica si el bot está "escribiendo" una respuesta. */
  private isTyping = false;
  /** Clave para guardar y recuperar el historial del chat en localStorage. */
  private readonly STORAGE_KEY = 'chatbot-history';
  /** Clave para registrar en localStorage si el usuario ya ha abierto el chat alguna vez. */
  private readonly OPENED_KEY = 'chatbot-opened';

  /** Opciones de respuesta rápida que se muestran al iniciar una nueva conversación. */
  private readonly QUICK_OPTIONS = [
    "📱 Ver planes móviles",
    "🏠 Internet en casa",
    "📍 ¿Dónde están?",
    "💼 Planes empresariales"
  ];

  /**
   * Inicializa el cliente del chatbot.
   */
  constructor() {
    this.init();
  }

  /**
   * Se asegura de que el DOM esté completamente cargado antes de ejecutar
   * la configuración principal. También añade soporte para Astro View Transitions.
   */
  private init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
    document.addEventListener('astro:page-load', () => this.setup());
  }

  /**
   * Realiza la configuración principal: obtiene los elementos del DOM,
   * adjunta los listeners de eventos y carga el historial del chat.
   * Falla silenciosamente si no se encuentran los elementos del chatbot en la página.
   */
  private setup() {
    try {
      if (document.querySelector('.chatbot-quick-reply')) return;

      this.elements = this.getElements();
      this.attachEventListeners();
      this.loadHistory();
      this.checkFirstVisit();

      if (this.history.length <= 1) {
        this.renderQuickReplies();
      }

      console.log('✅ Chatbot Client Ready');
    } catch (error) {
      // Silent fail if elements are not found (e.g., page without chat)
    }
  }

  /**
   * Obtiene y devuelve todos los elementos del DOM necesarios para el chatbot.
   * @throws {Error} Si no se encuentra un elemento del DOM requerido.
   * @returns Un objeto que contiene las referencias a los elementos del DOM.
   */
  private getElements(): ChatbotElements {
    const get = (id: string) => {
      const el = document.getElementById(id);
      if (!el) throw new Error(`Elemento #${id} no encontrado`);
      return el;
    };

    return {
      container: get('chatbot-container'),
      fab: get('chatbot-toggle') as HTMLButtonElement,
      window: get('chatbot-window'),
      messages: get('chatbot-messages'),
      input: get('chatbot-input') as HTMLInputElement,
      form: get('chatbot-form') as HTMLFormElement,
      quickReplies: get('chatbot-quick-replies'),
      badge: get('chatbot-badge'),
      sendBtn: get('chatbot-send-btn') as HTMLButtonElement,
      minimizeBtn: get('chatbot-minimize') as HTMLButtonElement,
      resetBtn: get('chatbot-reset') as HTMLButtonElement,
      callout: get('chatbot-callout'),
    };
  }

  /**
   * Renderiza los botones de respuesta rápida en la interfaz del chat.
   */
  private renderQuickReplies() {
    this.elements.quickReplies.innerHTML = '';
    this.elements.quickReplies.style.display = 'flex';

    this.QUICK_OPTIONS.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt;
      btn.className = 'chatbot-quick-reply whitespace-nowrap rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 hover:border-blue-300 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-800/30';
      btn.dataset.message = opt;
      this.elements.quickReplies.appendChild(btn);
    });
  }

  /**
   * Adjunta todos los listeners de eventos necesarios a los elementos del DOM del chatbot.
   * Esto incluye abrir/cerrar, enviar mensajes, reseteo, etc.
   */
  private attachEventListeners() {
    this.elements.fab.onclick = (e) => { e.preventDefault(); this.toggle(); };
    this.elements.minimizeBtn.onclick = (e) => { e.preventDefault(); this.toggle(); };

    let resetTimeout: any;

    this.elements.resetBtn.onclick = (e) => {
      e.preventDefault();
      const btn = this.elements.resetBtn;

      if (btn.dataset.confirm === 'true') {
        this.elements.messages.style.opacity = '0';
        setTimeout(() => {
          localStorage.removeItem(this.STORAGE_KEY);
          location.reload();
        }, 200);
      } else {
        btn.dataset.confirm = 'true';

        btn.classList.remove('text-slate-400', 'hover:bg-slate-100', 'hover:text-red-500', 'dark:hover:bg-white/5');
        btn.classList.add('bg-red-500', 'text-white', 'scale-110', 'shadow-md', 'ring-2', 'ring-red-200', 'dark:ring-red-900');

        btn.innerHTML = `<svg class="h-5 w-5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`;

        const revert = () => {
          btn.dataset.confirm = 'false';
          btn.innerHTML = `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`;

          btn.classList.remove('bg-red-500', 'text-white', 'scale-110', 'shadow-md', 'ring-2', 'ring-red-200', 'dark:ring-red-900');
          btn.classList.add('text-slate-400', 'hover:bg-slate-100', 'hover:text-red-500', 'dark:hover:bg-white/5');
        };

        clearTimeout(resetTimeout);
        resetTimeout = setTimeout(revert, 3000);

        btn.onmouseleave = () => {
          setTimeout(revert, 300);
        };
      }
    };

    this.elements.form.onsubmit = (e) => {
      e.preventDefault();
      this.sendMessage();
    };

    this.elements.quickReplies.onclick = (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON') {
        const msg = target.textContent || "";
        this.elements.input.value = msg;
        this.sendMessage();
      }
    };

    this.elements.input.oninput = () => this.updateSendButton();

    this.elements.input.onkeydown = (e) => {
      if (e.key === 'Escape') this.toggle();
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this.handleViewportResize());
      window.visualViewport.addEventListener('scroll', () => this.handleViewportResize());
    }
  }

  private handleViewportResize() {
    if (!this.isOpen || window.innerWidth > 640) return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const windowEl = this.elements.window;

    windowEl.style.height = `${viewport.height}px`;
    windowEl.style.top = `${viewport.offsetTop}px`;
    windowEl.style.bottom = 'auto';

    if (document.activeElement === this.elements.input) {
      setTimeout(() => {
        this.elements.input.scrollIntoView({ block: 'nearest' });
      }, 50);
    }
  }

  private toggle() {
    this.isOpen = !this.isOpen;
    this.elements.fab.classList.toggle('active', this.isOpen);
    this.elements.window.classList.toggle('active', this.isOpen);

    if (this.isOpen) {
      this.markAsOpened();
      this.hideBadge();
      this.elements.callout.style.display = 'none';

      if (window.innerWidth <= 640) {
        this.handleViewportResize();
        document.body.style.overflow = 'hidden';
      } else {
        this.elements.input.focus();
      }
      this.scrollToBottom();
    } else {
      document.body.style.overflow = '';
      this.elements.callout.style.display = '';

      this.elements.window.style.height = '';
      this.elements.window.style.top = '';
      this.elements.window.style.bottom = '';
    }
  }

  /**
   * Procesa y envía el mensaje del usuario a la API de chat.
   * Gestiona el estado de "escribiendo" y maneja las respuestas o errores.
   */
  private async sendMessage() {
    const message = this.elements.input.value.trim();
    if (!message || this.isTyping) return;

    this.elements.input.value = '';
    this.updateSendButton();
    this.addMessage('user', message);

    // Ocultar quick replies al interactuar
    this.elements.quickReplies.style.display = 'none';

    this.showTyping();

    try {
      const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: this.history.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      this.hideTyping();

      if (response.ok && data.response) {
        this.addMessage('bot', data.response);
      } else {
        const errorMessage = data.fallback ||
          'Disculpa, tuve un problema técnico. 😔\n\nPor favor intenta de nuevo o llámanos:\n📞 Tuxtla: 961 618 92 00\n📞 Tapachula: 962 625 58 10';
        this.addMessage('bot', errorMessage);

        if (data.error) {
          console.error('❌ Error del servidor:', data.error);
        }
      }
    } catch (error) {
      this.hideTyping();
      console.error('❌ Error de conexión:', error);
      this.addMessage('bot', 'Parece que hay un problema de conexión. 😔\n\nPor favor verifica tu internet o llámanos:\n📞 Tuxtla: 961 618 92 00\n📞 Tapachula: 962 625 58 10');
    }
  }

  /**
   * Añade un mensaje al historial y lo renderiza en la ventana del chat.
   * @param role El rol del remitente ('user' o 'bot').
   * @param content El contenido del mensaje de texto.
   */
  private addMessage(role: 'user' | 'bot', content: string) {
    const message: Message = { role, content, timestamp: new Date() };
    this.history.push(message);
    this.saveHistory();

    const msgDiv = document.createElement('div');
    const alignment = role === 'bot' ? 'self-start' : 'self-end';
    const colorClass = role === 'bot'
      ? 'bg-slate-100 text-slate-800 shadow-sm dark:bg-[#1f2937] dark:text-slate-200 dark:ring-1 dark:ring-white/5 rounded-tl-none'
      : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md rounded-br-none';

    msgDiv.className = `flex flex-col max-w-[85%] ${alignment} mb-3 animate-slide-up`;
    msgDiv.innerHTML = `
            <div class="px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${colorClass}">
                ${this.parseMarkdown(content)}
            </div>
            <span class="text-[10px] text-slate-400 mt-1 px-1 opacity-70">
                ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        `;

    this.elements.messages.appendChild(msgDiv);
    this.scrollToBottom();
  }

  /**
   * Muestra el indicador de "escribiendo" en la interfaz del chat.
   */
  private showTyping() {
    this.isTyping = true;
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'self-start mb-3 animate-slide-up';
    typingDiv.innerHTML = `
            <div class="bg-slate-100 dark:bg-[#1f2937] px-4 py-4 rounded-2xl rounded-tl-none flex gap-1.5 items-center h-10 shadow-sm">
                <span class="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full animate-typing"></span>
                <span class="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full animate-typing" style="animation-delay: 0.2s"></span>
                <span class="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full animate-typing" style="animation-delay: 0.4s"></span>
            </div>
        `;
    this.elements.messages.appendChild(typingDiv);
    this.scrollToBottom();
  }

  /**
   * Oculta el indicador de "escribiendo".
   */
  private hideTyping() {
    this.isTyping = false;
    document.getElementById('typing-indicator')?.remove();
  }

  /**
   * Desplaza suavemente el contenedor de mensajes hasta el final.
   */
  private scrollToBottom() {
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
  }

  /**
   * Habilita o deshabilita el botón de enviar basado en si hay texto en el input.
   */
  private updateSendButton() {
    this.elements.sendBtn.disabled = !this.elements.input.value.trim();
  }

  /**
   * Convierte un subconjunto simple de Markdown (negritas y saltos de línea) a HTML.
   * @param text El texto plano a convertir.
   * @returns Una cadena de texto con formato HTML.
   */
  private parseMarkdown(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  /**
   * Guarda los últimos 20 mensajes del historial en localStorage.
   */
  private saveHistory() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.history.slice(-20)));
  }

  /**
   * Carga el historial de chat desde localStorage al iniciar.
   */
  private loadHistory() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
    }
  }

  /**
   * Comprueba si el usuario ya ha abierto el chatbot antes para ocultar el badge.
   */
  private checkFirstVisit() {
    if (localStorage.getItem(this.OPENED_KEY)) {
      this.hideBadge();
    }
  }

  /**
   * Marca en localStorage que el usuario ya ha abierto el chatbot.
   */
  private markAsOpened() {
    localStorage.setItem(this.OPENED_KEY, 'true');
  }

  /**
   * Oculta el badge de notificación del chatbot.
   */
  private hideBadge() {
    this.elements.badge.classList.add('hidden');
  }
}