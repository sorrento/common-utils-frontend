import { generateAuthEmailHtml, EmailProjectConfig } from '../../../common-utils-shared';

export interface SendAuthEmailParams {
  emailServiceUrl?: string;
  recipientEmail: string;
  recipientName?: string;
  actionLink: string;
  type: 'verification' | 'password_reset';
  projectConfig: EmailProjectConfig;
}

export async function sendAuthEmail(params: SendAuthEmailParams): Promise<boolean> {
  const { emailServiceUrl, recipientEmail, recipientName, actionLink, type, projectConfig } = params;

  // Render email HTML & subject on client using common-utils-shared
  const { subject, html } = generateAuthEmailHtml({
    recipientEmail,
    recipientName,
    actionLink,
    type,
    projectConfig,
  });

  if (!emailServiceUrl) {
    console.warn('[AuthService] emailServiceUrl no configurada. Simulando envío de email:', {
      to: recipientEmail,
      subject,
      actionLink,
    });
    return true;
  }

  try {
    const response = await fetch(emailServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: recipientEmail,
        subject,
        html,
        appName: projectConfig.appName,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[AuthService] Error al enviar email vía servicio centralizado:', errText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[AuthService] Excepción al llamar al servicio centralizado de email:', error);
    return false;
  }
}
