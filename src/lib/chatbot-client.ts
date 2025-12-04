// src/lib/chatbot-client.ts

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
  resetBtn: HTMLButtonElement;
  callout: HTMLElement;
}

export class ChatbotClient {
  private elements!: ChatbotElements;
  private history: Message[] = [];
  private isOpen = false;
  private isTyping = false;
  private readonly STORAGE_KEY = 'chatbot-history';
  private readonly OPENED_KEY = 'chatbot-opened';

  // Opciones rápidas iniciales
  private readonly QUICK_OPTIONS = [
    "📱 Ver planes móviles",
    "🏠 Internet en casa",
    "📍 ¿Dónde están?",
    "💼 Planes empresariales"
  ];

  constructor() {
    this.init();
  }

  private init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
    // Soporte para Astro ViewTransitions
    document.addEventListener('astro:page-load', () => this.setup());
  }

  private setup() {
    try {
      // Evitar reinicialización si ya existe
      if (document.querySelector('.chatbot-quick-reply')) return;

      this.elements = this.getElements();
      this.attachEventListeners();
      this.loadHistory(); // Carga historial o inicializa Quick Replies
      this.checkFirstVisit();

      // Si el historial está vacío, mostrar opciones
      if (this.history.length <= 1) { // 1 porque el welcome message no cuenta en history array usualmente o sí depende de la implementación.
        this.renderQuickReplies();
      }

      console.log('✅ Chatbot Client Ready');
    } catch (error) {
      // Silent fail si no encuentra elementos (ej. página sin chat)
    }
  }

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

  private renderQuickReplies() {
    this.elements.quickReplies.innerHTML = '';
    this.elements.quickReplies.style.display = 'flex';

    this.QUICK_OPTIONS.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt;
      btn.className = 'chatbot-quick-reply whitespace-nowrap rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 hover:border-blue-300 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-800/30';
      btn.dataset.message = opt; // Para el event delegation
      this.elements.quickReplies.appendChild(btn);
    });
  }

  private attachEventListeners() {
    // Toggle
    this.elements.fab.onclick = (e) => { e.preventDefault(); this.toggle(); };
    this.elements.minimizeBtn.onclick = (e) => { e.preventDefault(); this.toggle(); };

    // Reset con doble confirmación visual (sin alert feo)
    let resetTimeout: any;
    
    this.elements.resetBtn.onclick = (e) => {
      e.preventDefault();
      const btn = this.elements.resetBtn;
      
      if (btn.dataset.confirm === 'true') {
        // Segunda confirmación: Ejecutar acción
        this.elements.messages.style.opacity = '0';
        setTimeout(() => {
            localStorage.removeItem(this.STORAGE_KEY);
            location.reload();
        }, 200);
      } else {
        // Primer clic: ESTADO DE ALERTA
        btn.dataset.confirm = 'true';
        
        // Transformación visual fuerte (Rojo Sólido + Escala)
        // Quitamos estilos sutiles
        btn.classList.remove('text-slate-400', 'hover:bg-slate-100', 'hover:text-red-500', 'dark:hover:bg-white/5');
        // Añadimos estilos de alerta
        btn.classList.add('bg-red-500', 'text-white', 'scale-110', 'shadow-md', 'ring-2', 'ring-red-200', 'dark:ring-red-900');
        
        // Icono de Check Grueso (Confirmar)
        btn.innerHTML = `<svg class="h-5 w-5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`;
        
        // Función para revertir al estado original
        const revert = () => {
            btn.dataset.confirm = 'false';
            // Restaurar icono basura
            btn.innerHTML = `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`;
            
            // Restaurar estilos originales
            btn.classList.remove('bg-red-500', 'text-white', 'scale-110', 'shadow-md', 'ring-2', 'ring-red-200', 'dark:ring-red-900');
            btn.classList.add('text-slate-400', 'hover:bg-slate-100', 'hover:text-red-500', 'dark:hover:bg-white/5');
        };

        // Auto-revertir después de 3 segundos
        clearTimeout(resetTimeout);
        resetTimeout = setTimeout(revert, 3000);
        
        // Opcional: Revertir si el usuario saca el mouse (para evitar clics accidentales al volver)
        btn.onmouseleave = () => {
            setTimeout(revert, 300); // Pequeño delay para no ser frustrante
        };
      }
    };

    // Send
    this.elements.form.onsubmit = (e) => {
      e.preventDefault();
      this.sendMessage();
    };

    // Quick Replies Delegation
    this.elements.quickReplies.onclick = (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON') {
        const msg = target.textContent || "";
        this.elements.input.value = msg;
        this.sendMessage();
      }
    };

    // Input Auto-resize & Validation
    this.elements.input.oninput = () => this.updateSendButton();

    // Escape to close
    this.elements.input.onkeydown = (e) => {
      if (e.key === 'Escape') this.toggle();
    };

    // Mobile Viewport Fix (Keyboard)
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

    // ANCLAJE PERFECTO: Usar top + height del viewport visual
    // Esto "pega" el chat al área visible real, ignorando el scroll del navegador
    windowEl.style.height = `${viewport.height}px`;
    windowEl.style.top = `${viewport.offsetTop}px`;
    windowEl.style.bottom = 'auto'; // Importante: anular el bottom: 0 del CSS

    // Asegurar que el input sea visible si está enfocado
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
      this.elements.callout.style.display = 'none'; // Ocultar callout al abrir

      // Ajuste inicial para móvil
      if (window.innerWidth <= 640) {
        this.handleViewportResize();
        document.body.style.overflow = 'hidden'; // Prevenir scroll del body
      } else {
        this.elements.input.focus();
      }
      this.scrollToBottom();
    } else {
      document.body.style.overflow = ''; // Restaurar scroll
      this.elements.callout.style.display = ''; // Restaurar callout al cerrar (vuelve a flex por CSS si no tiene inline)

      // LIMPIEZA TOTAL DE ESTILOS INLINE
      this.elements.window.style.height = '';
      this.elements.window.style.top = '';
      this.elements.window.style.bottom = '';
    }
  }

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
      const response = await fetch('/api/chat', {
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
        // Usar el mensaje de fallback si está disponible
        const errorMessage = data.fallback || 
          'Disculpa, tuve un problema técnico. 😔\n\nPor favor intenta de nuevo o llámanos:\n📞 Tuxtla: 961 618 92 00\n📞 Tapachula: 962 625 58 10';
        this.addMessage('bot', errorMessage);
        
        // Log para debugging
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

  private hideTyping() {
    this.isTyping = false;
    document.getElementById('typing-indicator')?.remove();
  }

  private scrollToBottom() {
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
  }

  private updateSendButton() {
    this.elements.sendBtn.disabled = !this.elements.input.value.trim();
  }

  private parseMarkdown(text: string): string {
    // Simple parser para negritas y saltos
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  // Persistencia básica
  private saveHistory() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.history.slice(-20)));
  }

  private loadHistory() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Rehidratar mensajes previos (solo si es necesario)
      // En una app real, aquí reconstruirías el DOM si quieres persistencia visual entre recargas
    }
  }

  private checkFirstVisit() {
    if (localStorage.getItem(this.OPENED_KEY)) {
      this.hideBadge();
    }
  }

  private markAsOpened() {
    localStorage.setItem(this.OPENED_KEY, 'true');
  }

  private hideBadge() {
    this.elements.badge.classList.add('hidden');
  }
}