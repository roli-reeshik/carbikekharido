/**
 * Single, swappable SMS-provider interface.
 *
 * Design intent (per the "no API hell" constraint): the rest of the app
 * never talks to a specific SMS vendor directly. There is exactly ONE
 * function call — sendOtpSms() — that the auth route depends on. Swapping
 * providers (MSG91, Twilio, Gupshup, etc.) later means changing this one
 * file, not hunting through the codebase for scattered vendor calls.
 *
 * The demo implementation below just logs to the server console instead
 * of sending a real SMS, so this module runs with zero external API keys
 * out of the box. Replace sendOtpSms's body with a real provider call
 * when you're ready — the function signature is the only contract the
 * rest of the app relies on.
 */
export interface SmsProvider {
  sendOtpSms(phone: string, otp: string): Promise<{ success: boolean; error?: string }>;
}

class ConsoleLogSmsProvider implements SmsProvider {
  async sendOtpSms(phone: string, otp: string) {
    // Replace this block with a single real provider call, e.g.:
    //   await fetch("https://api.msg91.com/api/v5/otp", { ... })
    // Keep it to this one function — do not add parallel SMS call sites
    // elsewhere in the app.
    console.log(`[demo-sms-provider] OTP for +91${phone}: ${otp}`);
    return { success: true };
  }
}

export const smsProvider: SmsProvider = new ConsoleLogSmsProvider();
