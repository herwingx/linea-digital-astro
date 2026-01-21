// src/types/social-icons.ts

/**
 * Define los nombres de los iconos de redes sociales y aplicaciones que están soportados por el componente `SocialIcon`.
 * Este tipo se utiliza para asegurar que solo se puedan usar los nombres de iconos predefinidos.
 */
export type SocialIconName =
  | "whatsapp"
  | "facebook"
  | "x"
  | "twitter"
  | "instagram"
  | "snapchat"
  | "uber"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "telegram"
  | "discord"
  | "reddit"
  | "pinterest"
  | "teams"
  | "zoom"
  | "correo"
  | "email";

/**
 * Define los tamaños predefinidos disponibles para el componente `SocialIcon`.
 */
export type IconSize = "sm" | "md" | "lg";
