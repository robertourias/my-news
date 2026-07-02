"use client";

import Script from "next/script";

interface TurnstileWidgetProps {
  siteKey: string;
}

/**
 * Renderização implícita: o script da Cloudflare escaneia o DOM por
 * `.cf-turnstile` e injeta o widget + input hidden `cf-turnstile-response`
 * dentro do form mais próximo automaticamente.
 */
export function TurnstileWidget({ siteKey }: TurnstileWidgetProps) {
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div className="cf-turnstile" data-sitekey={siteKey} data-theme="dark" />
    </>
  );
}
