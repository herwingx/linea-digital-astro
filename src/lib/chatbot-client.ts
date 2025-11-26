// src/lib/chatbot-client.ts
/**
 * Cliente del Chatbot (Frontend)
 * 
 * Maneja toda la lógica de interacción del usuario con el chatbot,
 * incluyendo UI, estado, y comunicación con la API.
 */

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

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
}

export class ChatbotClient {
  private elements!: ChatbotElements;
  private history: Message[] = [];
  private isOpen = false;
  private isTyping = false;
  private readonly STORAGE_KEY = 'chatbot-history';
  private readonly OPENED_KEY = 'chatbot-opened';

  constructor() {
    this.init();
  }

  /**
   * Inicializa el chatbot
   */
  private init() {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  /**
   * Configura todos los elementos y event listeners
   */
  private setup() {
    try {
      this.elements = this.getElements();
      this.attachEventListeners();
      this.loadHistory();
      this.checkFirstVisit();

      console.log('✅ Chatbot inicializado correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar chatbot:', error);
    }
  }

  /**
   * Obtiene referencias a todos los elementos del DOM
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
    };
  }

  /**
   * Adjunta todos los event listeners
   */
  private attachEventListeners() {
    // Toggle chat
    this.elements.fab.addEventListener('click', () => this.toggle());
    this.elements.minimizeBtn.addEventListener('click', () => this.toggle());

    // Enviar mensaje
    this.elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    // Quick replies
    this.elements.quickReplies.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('chatbot-quick-reply')) {
        const message = target.dataset.message;
        if (message) {
          this.elements.input.value = message;
          this.sendMessage();
        }
      }
    });

    // Auto-resize input
    this.elements.input.addEventListener('input', () => {
      this.updateSendButton();
    });

    // Keyboard shortcuts
    this.elements.input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.toggle();
      }
    });

    // Detectar cuando el teclado virtual se abre/cierra en móviles
    this.setupKeyboardDetection();
  }

  /**
   * Detecta cuando el teclado virtual se abre/cierra en móviles
   */
  private setupKeyboardDetection() {
    // Solo en móviles
    if (window.innerWidth > 640) return;

    let initialHeight = window.visualViewport?.height || window.innerHeight;

    // Listener para focus en el input (teclado se abre)
    this.elements.input.addEventListener('focus', () => {
      // Pequeño delay para que el teclado se abra
      setTimeout(() => {
        this.elements.window.classList.add('keyboard-open');
        // Scroll al input para asegurar que sea visible
        this.elements.input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 300);
    });

    // Listener para blur en el input (teclado se cierra)
    this.elements.input.addEventListener('blur', () => {
      setTimeout(() => {
        this.elements.window.classList.remove('keyboard-open');
      }, 100);
    });

    // Detectar cambios en el viewport (más robusto)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        const currentHeight = window.visualViewport?.height || window.innerHeight;
        const heightDiff = initialHeight - currentHeight;

        // Si el viewport se redujo más de 150px, probablemente el teclado está abierto
        if (heightDiff > 150) {
          this.elements.window.classList.add('keyboard-open');
        } else {
          this.elements.window.classList.remove('keyboard-open');
        }
      });
    }
  }

  /**
   * Abre/cierra el chat
   */
  private toggle() {
    this.isOpen = !this.isOpen;
    this.elements.fab.classList.toggle('active', this.isOpen);
    this.elements.window.classList.toggle('active', this.isOpen);

    if (this.isOpen) {
      this.elements.input.focus();
      this.hideBadge();
      this.markAsOpened();
    }
  }

  /**
   * Envía un mensaje del usuario
   */
  private async sendMessage() {
    const message = this.elements.input.value.trim();

    if (!message || this.isTyping) return;

    // Limpiar input
    this.elements.input.value = '';
    this.updateSendButton();

    // Agregar mensaje del usuario
    this.addMessage('user', message);

    // Ocultar quick replies después del primer mensaje
    if (this.history.length > 2) {
      this.elements.quickReplies.style.display = 'none';
    }

    // Mostrar indicador de escritura
    this.showTyping();

    // En móviles, mantener el focus en el input
    if (window.innerWidth <= 640) {
      // Pequeño delay para que el teclado no se cierre
      setTimeout(() => {
        this.elements.input.focus();
      }, 50);
    }

    try {
      // Llamar a la API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: this.history.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      this.hideTyping();

      if (response.ok && data.response) {
        this.addMessage('bot', data.response);
      } else {
        // Error de la API
        this.addMessage(
          'bot',
          data.fallback ||
          'Lo siento, hubo un error. Por favor intenta de nuevo o llama al 961 618 92 00. 📞'
        );
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      this.hideTyping();
      this.addMessage(
        'bot',
        'Lo siento, no pude conectarme al servidor. Por favor verifica tu conexión e intenta de nuevo. 📞'
      );
    }
  }

  /**
   * Agrega un mensaje al chat
   */
  private addMessage(role: 'user' | 'bot', content: string) {
    const message: Message = {
      role,
      content,
      timestamp: new Date(),
    };

    this.history.push(message);
    this.saveHistory();

    // Crear elemento del mensaje
    const messageEl = document.createElement('div');
    messageEl.className = `chatbot-message chatbot-message-${role}`;

    const contentEl = document.createElement('div');
    contentEl.className = 'chatbot-message-content';

    // Renderizar markdown solo para mensajes del bot
    if (role === 'bot') {
      contentEl.innerHTML = this.renderMarkdown(content);
    } else {
      contentEl.innerHTML = this.escapeHtml(content).replace(/\n/g, '<br>');
    }

    const timeEl = document.createElement('span');
    timeEl.className = 'chatbot-message-time';
    timeEl.textContent = this.formatTime(message.timestamp);

    messageEl.appendChild(contentEl);
    messageEl.appendChild(timeEl);
    this.elements.messages.appendChild(messageEl);

    // Scroll al final
    this.scrollToBottom();
  }

  /**
   * Muestra el indicador de escritura
   */
  private showTyping() {
    this.isTyping = true;
    this.elements.sendBtn.disabled = true;

    const typing = document.createElement('div');
    typing.className = 'chatbot-typing';
    typing.id = 'typing-indicator';
    typing.innerHTML = '<span></span><span></span><span></span>';

    this.elements.messages.appendChild(typing);
    this.scrollToBottom();
  }

  /**
   * Oculta el indicador de escritura
   */
  private hideTyping() {
    this.isTyping = false;
    this.elements.sendBtn.disabled = false;

    const typing = document.getElementById('typing-indicator');
    typing?.remove();
  }

  /**
   * Scroll al final del chat
   */
  private scrollToBottom() {
    setTimeout(() => {
      this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }, 100);
  }

  /**
   * Actualiza el estado del botón de enviar
   */
  private updateSendButton() {
    const hasText = this.elements.input.value.trim().length > 0;
    this.elements.sendBtn.disabled = !hasText || this.isTyping;
  }

  /**
   * Formatea la hora del mensaje
   */
  private formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Ahora';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;

    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Escapa HTML para prevenir XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Renderiza markdown simple a HTML
   */
  private renderMarkdown(text: string): string {
    // Escapar HTML primero
    let html = this.escapeHtml(text);

    // Convertir **texto** a <strong>texto</strong>
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Convertir *texto* a <em>texto</em>
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Convertir listas con • o -
    html = html.replace(/^[•\-]\s+(.+)$/gm, '<li>$1</li>');

    // Envolver listas en <ul>
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul class="chatbot-list">$&</ul>');

    // Convertir saltos de línea dobles a párrafos
    html = html.replace(/\n\n/g, '</p><p>');

    // Convertir saltos de línea simples a <br>
    html = html.replace(/\n/g, '<br>');

    // Envolver en párrafo si no está ya
    if (!html.startsWith('<ul') && !html.startsWith('<p')) {
      html = '<p>' + html + '</p>';
    }

    return html;
  }

  /**
   * Guarda el historial en localStorage
   */
  private saveHistory() {
    try {
      // Guardar solo los últimos 20 mensajes
      const toSave = this.history.slice(-20).map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
      }));

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.warn('No se pudo guardar el historial:', error);
    }
  }

  /**
   * Carga el historial desde localStorage
   */
  private loadHistory() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);

      // Restaurar mensajes (excepto el de bienvenida que ya está)
      parsed.forEach((msg: any) => {
        if (msg.role === 'user' || this.history.length > 0) {
          const message: Message = {
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
          };

          this.history.push(message);

          // Agregar al DOM si no es el mensaje de bienvenida
          if (msg.role === 'user' || this.history.length > 1) {
            const messageEl = document.createElement('div');
            messageEl.className = `chatbot-message chatbot-message-${msg.role}`;

            const contentEl = document.createElement('div');
            contentEl.className = 'chatbot-message-content';

            // Renderizar markdown solo para mensajes del bot
            if (msg.role === 'bot') {
              contentEl.innerHTML = this.renderMarkdown(msg.content);
            } else {
              contentEl.innerHTML = this.escapeHtml(msg.content).replace(/\n/g, '<br>');
            }

            const timeEl = document.createElement('span');
            timeEl.className = 'chatbot-message-time';
            timeEl.textContent = this.formatTime(message.timestamp);

            messageEl.appendChild(contentEl);
            messageEl.appendChild(timeEl);
            this.elements.messages.appendChild(messageEl);
          }
        }
      });

      // Ocultar quick replies si ya hay conversación
      if (this.history.length > 2) {
        this.elements.quickReplies.style.display = 'none';
      }

      this.scrollToBottom();
    } catch (error) {
      console.warn('No se pudo cargar el historial:', error);
    }
  }

  /**
   * Verifica si es la primera visita
   */
  private checkFirstVisit() {
    const hasOpened = localStorage.getItem(this.OPENED_KEY);
    if (hasOpened) {
      this.hideBadge();
    }
  }

  /**
   * Marca como abierto
   */
  private markAsOpened() {
    localStorage.setItem(this.OPENED_KEY, 'true');
  }

  /**
   * Oculta el badge de notificación
   */
  private hideBadge() {
    this.elements.badge.classList.add('hidden');
  }

  /**
   * Limpia el historial (útil para debugging)
   */
  public clearHistory() {
    this.history = [];
    localStorage.removeItem(this.STORAGE_KEY);

    // Limpiar mensajes del DOM excepto el de bienvenida
    const messages = this.elements.messages.querySelectorAll('.chatbot-message');
    messages.forEach((msg, index) => {
      if (index > 0) msg.remove();
    });

    // Mostrar quick replies
    this.elements.quickReplies.style.display = 'flex';

    console.log('🗑️ Historial limpiado');
  }
}

// Inicializar automáticamente cuando se carga el script
if (typeof window !== 'undefined') {
  // Exponer globalmente para debugging
  (window as any).chatbot = new ChatbotClient();

  // Exponer método de limpieza para debugging
  (window as any).clearChatHistory = () => {
    (window as any).chatbot?.clearHistory();
  };
}
