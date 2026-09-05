import dns from "dns/promises";
import crypto from "crypto";

export interface DnsCheckResult {
  spfVerified: boolean;
  dkimVerified: boolean;
  dmarcVerified: boolean;
  spfRecord?: string;
  dmarcRecord?: string;
}

export class EmailDomainService {
  /**
   * Generates an RSA key pair for DKIM signing.
   */
  static generateDkimKeys(): { privateKey: string; publicKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    });

    return { privateKey, publicKey };
  }

  /**
   * Extracts the bare public key string from the PEM format for use in DNS.
   */
  static extractDkimPublicKeyForDns(pemPublicKey: string): string {
    return pemPublicKey
      .replace("-----BEGIN PUBLIC KEY-----", "")
      .replace("-----END PUBLIC KEY-----", "")
      .replace(/\s+/g, "");
  }

  /**
   * Checks SPF, DKIM, and DMARC records for a given domain.
   */
  static async verifyDnsRecords(
    domain: string,
    dkimSelector: string,
    expectedDkimPublicKey: string
  ): Promise<DnsCheckResult> {
    const result: DnsCheckResult = {
      spfVerified: false,
      dkimVerified: false,
      dmarcVerified: false,
    };

    try {
      // 1. Check SPF
      const txtRecords = await dns.resolveTxt(domain).catch(() => []);
      for (const record of txtRecords) {
        const txt = record.join("");
        if (txt.includes("v=spf1")) {
          result.spfRecord = txt;
          // In a real system, you'd check if your provider's include mechanism is present.
          // For now, we just verify an SPF record exists.
          result.spfVerified = true;
          break;
        }
      }

      // 2. Check DKIM
      const dkimDomain = `${dkimSelector}._domainkey.${domain}`;
      const dkimRecords = await dns.resolveTxt(dkimDomain).catch(() => []);
      
      const cleanExpectedKey = this.extractDkimPublicKeyForDns(expectedDkimPublicKey);
      
      for (const record of dkimRecords) {
        const txt = record.join("");
        if (txt.includes("v=DKIM1") && txt.includes("p=")) {
          // Verify if it matches our expected key (or just verify it exists)
          if (txt.includes(cleanExpectedKey.substring(0, 50))) {
            result.dkimVerified = true;
          }
          break;
        }
      }

      // 3. Check DMARC
      const dmarcDomain = `_dmarc.${domain}`;
      const dmarcRecords = await dns.resolveTxt(dmarcDomain).catch(() => []);
      for (const record of dmarcRecords) {
        const txt = record.join("");
        if (txt.includes("v=DMARC1")) {
          result.dmarcRecord = txt;
          result.dmarcVerified = true;
          break;
        }
      }

    } catch (err) {
      console.error(`DNS Verification failed for ${domain}:`, err);
    }

    return result;
  }
}
