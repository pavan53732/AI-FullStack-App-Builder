/**
 * License Checker
 * Mechanisms 436: Check license compatibility and legal compliance
 */

export interface LicenseInfo {
  name: string;
  spdxId: string;
  type: LicenseType;
  permissions: string[];
  limitations: string[];
  conditions: string[];
  commercial: boolean;
  attribution: boolean;
  copyleft: boolean;
  patentGrant: boolean;
}

export type LicenseType =
  | 'permissive'
  | 'weak_copyleft'
  | 'strong_copyleft'
  | 'public_domain'
  | 'proprietary'
  | 'unknown';

export interface DependencyLicense {
  packageName: string;
  version: string;
  license: LicenseInfo;
  licenseText?: string;
  copyrightNotice?: string;
  repository?: string;
  homepage?: string;
}

export interface LicenseCompatibilityResult {
  compatible: boolean;
  issues: LicenseIssue[];
  recommendations: string[];
  allowedLicenses: string[];
  forbiddenLicenses: string[];
  requiresReview: string[];
}

export interface LicenseIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: LicenseIssueType;
  packageName: string;
  description: string;
  resolution: string;
}

export type LicenseIssueType =
  | 'incompatible_license'
  | 'missing_license'
  | 'ambiguous_license'
  | 'copyleft_conflict'
  | 'patent_concern'
  | 'commercial_restriction'
  | 'attribution_required';

export interface LicensePolicy {
  allowedLicenses: string[];
  forbiddenLicenses: string[];
  requiresReview: string[];
  commercialUseAllowed: boolean;
  requireAttribution: boolean;
  allowCopyleft: boolean;
}

export interface LicenseReport {
  id: string;
  timestamp: Date;
  project: string;
  dependencies: DependencyLicense[];
  summary: LicenseSummary;
  compatibility: LicenseCompatibilityResult;
  violations: LicenseViolation[];
  attributions: Attribution[];
  recommendations: string[];
}

export interface LicenseSummary {
  totalDependencies: number;
  licenseDistribution: Record<string, number>;
  licenseTypes: Record<LicenseType, number>;
  compatibleCount: number;
  incompatibleCount: number;
  unknownCount: number;
}

export interface LicenseViolation {
  packageName: string;
  violation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: string;
}

export interface Attribution {
  packageName: string;
  license: string;
  copyright: string;
  attributionText: string;
}

// Standard licenses database
const LICENSES_DATABASE: Record<string, LicenseInfo> = {
  'MIT': {
    name: 'MIT License',
    spdxId: 'MIT',
    type: 'permissive',
    permissions: ['commercial-use', 'modification', 'distribution', 'private-use'],
    limitations: ['liability', 'warranty'],
    conditions: ['include-copyright'],
    commercial: true,
    attribution: true,
    copyleft: false,
    patentGrant: false,
  },
  'Apache-2.0': {
    name: 'Apache License 2.0',
    spdxId: 'Apache-2.0',
    type: 'permissive',
    permissions: ['commercial-use', 'modification', 'distribution', 'private-use', 'patent-use'],
    limitations: ['liability', 'warranty', 'trademark-use'],
    conditions: ['include-copyright', 'license-notice', 'state-changes'],
    commercial: true,
    attribution: true,
    copyleft: false,
    patentGrant: true,
  },
  'BSD-2-Clause': {
    name: 'BSD 2-Clause "Simplified" License',
    spdxId: 'BSD-2-Clause',
    type: 'permissive',
    permissions: ['commercial-use', 'modification', 'distribution', 'private-use'],
    limitations: ['liability', 'warranty'],
    conditions: ['include-copyright'],
    commercial: true,
    attribution: true,
    copyleft: false,
    patentGrant: false,
  },
  'BSD-3-Clause': {
    name: 'BSD 3-Clause "New" or "Revised" License',
    spdxId: 'BSD-3-Clause',
    type: 'permissive',
    permissions: ['commercial-use', 'modification', 'distribution', 'private-use'],
    limitations: ['liability', 'warranty', 'trademark-use'],
    conditions: ['include-copyright'],
    commercial: true,
    attribution: true,
    copyleft: false,
    patentGrant: false,
  },
  'ISC': {
    name: 'ISC License',
    spdxId: 'ISC',
    type: 'permissive',
    permissions: ['commercial-use', 'modification', 'distribution', 'private-use'],
    limitations: ['liability', 'warranty'],
    conditions: ['include-copyright'],
    commercial: true,
    attribution: true,
    copyleft: false,
    patentGrant: false,
  },
  'GPL-2.0': {
    name: 'GNU General Public License v2.0',
    spdxId: 'GPL-2.0',
    type: 'strong_copyleft',
    permissions: ['commercial-use', 'modification', 'distribution', 'patent-use'],
    limitations: ['liability', 'warranty'],
    conditions: ['include-copyright', 'source-disclosure', 'license-and-copyright-notice', 'same-license'],
    commercial: true,
    attribution: true,
    copyleft: true,
    patentGrant: false,
  },
  'GPL-3.0': {
    name: 'GNU General Public License v3.0',
    spdxId: 'GPL-3.0',
    type: 'strong_copyleft',
    permissions: ['commercial-use', 'modification', 'distribution', 'patent-use'],
    limitations: ['liability', 'warranty'],
    conditions: ['include-copyright', 'source-disclosure', 'license-and-copyright-notice', 'same-license'],
    commercial: true,
    attribution: true,
    copyleft: true,
    patentGrant: true,
  },
  'LGPL-2.1': {
    name: 'GNU Lesser General Public License v2.1',
    spdxId: 'LGPL-2.1',
    type: 'weak_copyleft',
    permissions: ['commercial-use', 'modification', 'distribution'],
    limitations: ['liability', 'warranty'],
    conditions: ['include-copyright', 'source-disclosure', 'license-notice', 'dynamic-linking'],
    commercial: true,
    attribution: true,
    copyleft: true,
    patentGrant: false,
  },
  'LGPL-3.0': {
    name: 'GNU Lesser General Public License v3.0',
    spdxId: 'LGPL-3.0',
    type: 'weak_copyleft',
    permissions: ['commercial-use', 'modification', 'distribution', 'patent-use'],
    limitations: ['liability', 'warranty'],
    conditions: ['include-copyright', 'source-disclosure', 'license-notice', 'dynamic-linking'],
    commercial: true,
    attribution: true,
    copyleft: true,
    patentGrant: true,
  },
  'MPL-2.0': {
    name: 'Mozilla Public License 2.0',
    spdxId: 'MPL-2.0',
    type: 'weak_copyleft',
    permissions: ['commercial-use', 'modification', 'distribution', 'patent-use'],
    limitations: ['liability', 'warranty', 'trademark-use'],
    conditions: ['include-copyright', 'license-notice', 'same-license-file'],
    commercial: true,
    attribution: true,
    copyleft: true,
    patentGrant: true,
  },
  'Unlicense': {
    name: 'The Unlicense',
    spdxId: 'Unlicense',
    type: 'public_domain',
    permissions: ['commercial-use', 'modification', 'distribution', 'private-use'],
    limitations: ['liability'],
    conditions: [],
    commercial: true,
    attribution: false,
    copyleft: false,
    patentGrant: false,
  },
  'CC0-1.0': {
    name: 'Creative Commons Zero v1.0 Universal',
    spdxId: 'CC0-1.0',
    type: 'public_domain',
    permissions: ['commercial-use', 'modification', 'distribution', 'private-use'],
    limitations: ['liability'],
    conditions: [],
    commercial: true,
    attribution: false,
    copyleft: false,
    patentGrant: false,
  },
  '0BSD': {
    name: 'BSD Zero Clause License',
    spdxId: '0BSD',
    type: 'public_domain',
    permissions: ['commercial-use', 'modification', 'distribution', 'private-use'],
    limitations: ['liability', 'warranty'],
    conditions: [],
    commercial: true,
    attribution: false,
    copyleft: false,
    patentGrant: false,
  },
};

export class LicenseChecker {
  private licenses: Map<string, LicenseInfo>;
  private policy: LicensePolicy;
  private compatibilityMatrix: Map<string, Set<string>>;

  constructor(policy?: Partial<LicensePolicy>) {
    this.licenses = new Map(Object.entries(LICENSES_DATABASE));
    this.policy = {
      allowedLicenses: ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', '0BSD', 'Unlicense'],
      forbiddenLicenses: [],
      requiresReview: ['GPL-2.0', 'GPL-3.0', 'LGPL-2.1', 'LGPL-3.0', 'MPL-2.0'],
      commercialUseAllowed: true,
      requireAttribution: false,
      allowCopyleft: false,
      ...policy,
    };
    this.compatibilityMatrix = this.buildCompatibilityMatrix();
  }

  /**
   * Get license information
   */
  getLicense(spdxId: string): LicenseInfo | undefined {
    return this.licenses.get(spdxId);
  }

  /**
   * Check if a license is compatible with project
   */
  checkCompatibility(
    dependencies: DependencyLicense[]
  ): LicenseCompatibilityResult {
    const issues: LicenseIssue[] = [];
    const recommendations: string[] = [];
    const allowedLicenses: string[] = [];
    const forbiddenLicenses: string[] = [];
    const requiresReview: string[] = [];

    for (const dep of dependencies) {
      const licenseId = dep.license.spdxId;

      // Check if license is forbidden
      if (this.policy.forbiddenLicenses.includes(licenseId)) {
        forbiddenLicenses.push(dep.packageName);
        issues.push({
          severity: 'critical',
          type: 'incompatible_license',
          packageName: dep.packageName,
          description: `${dep.packageName} uses forbidden license: ${licenseId}`,
          resolution: 'Remove this dependency or find an alternative',
        });
        continue;
      }

      // Check if license requires review
      if (this.policy.requiresReview.includes(licenseId)) {
        requiresReview.push(dep.packageName);

        // Check copyleft
        if (dep.license.copyleft && !this.policy.allowCopyleft) {
          issues.push({
            severity: 'high',
            type: 'copyleft_conflict',
            packageName: dep.packageName,
            description: `${dep.packageName} has copyleft license: ${licenseId}`,
            resolution: 'Review copyleft implications or find alternative',
          });
        }
      }

      // Check commercial use
      if (this.policy.commercialUseAllowed && !dep.license.commercial) {
        issues.push({
          severity: 'high',
          type: 'commercial_restriction',
          packageName: dep.packageName,
          description: `${dep.packageName} does not allow commercial use`,
          resolution: 'Obtain commercial license or find alternative',
        });
      }

      // Check attribution
      if (this.policy.requireAttribution && dep.license.attribution) {
        recommendations.push(`Add attribution for ${dep.packageName}`);
      }

      // Check if allowed
      if (this.policy.allowedLicenses.includes(licenseId)) {
        allowedLicenses.push(dep.packageName);
      }
    }

    // Generate recommendations
    if (issues.some(i => i.type === 'copyleft_conflict')) {
      recommendations.push('Consider using permissively licensed alternatives');
    }
    if (issues.some(i => i.type === 'commercial_restriction')) {
      recommendations.push('Review commercial licensing requirements');
    }

    return {
      compatible: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
      issues,
      recommendations,
      allowedLicenses,
      forbiddenLicenses,
      requiresReview,
    };
  }

  /**
   * Check compatibility between two licenses
   */
  checkLicenseCompatibility(
    license1: string,
    license2: string
  ): LicenseCompatibility {
    const l1 = this.licenses.get(license1);
    const l2 = this.licenses.get(license2);

    if (!l1 || !l2) {
      return {
        compatible: false,
        reason: 'Unknown license',
      };
    }

    // Same license is always compatible
    if (license1 === license2) {
      return { compatible: true };
    }

    // Check compatibility matrix
    const compatibleSet = this.compatibilityMatrix.get(license1);
    if (compatibleSet?.has(license2)) {
      return { compatible: true };
    }

    // Permissive licenses are generally compatible
    if (l1.type === 'permissive' && l2.type === 'permissive') {
      return { compatible: true };
    }

    // Public domain is compatible with everything
    if (l1.type === 'public_domain' || l2.type === 'public_domain') {
      return { compatible: true };
    }

    // Strong copyleft can only combine with same or compatible
    if (l1.type === 'strong_copyleft' || l2.type === 'strong_copyleft') {
      return {
        compatible: false,
        reason: 'Strong copyleft licenses require derivative works to use same license',
      };
    }

    // Weak copyleft has specific rules
    if (l1.type === 'weak_copyleft' || l2.type === 'weak_copyleft') {
      return {
        compatible: true,
        conditions: ['Dynamic linking may be required', 'Check specific license terms'],
      };
    }

    return { compatible: true };
  }

  /**
   * Generate license report
   */
  generateReport(
    projectName: string,
    dependencies: DependencyLicense[]
  ): LicenseReport {
    const summary = this.generateSummary(dependencies);
    const compatibility = this.checkCompatibility(dependencies);
    const violations = this.findViolations(dependencies);
    const attributions = this.generateAttributions(dependencies);
    const recommendations = this.generateOverallRecommendations(
      compatibility,
      violations,
      summary
    );

    return {
      id: this.generateId(),
      timestamp: new Date(),
      project: projectName,
      dependencies,
      summary,
      compatibility,
      violations,
      attributions,
      recommendations,
    };
  }

  /**
   * Parse license from package.json or similar
   */
  parseLicense(licenseField: string | string[] | { type: string } | undefined): LicenseInfo {
    if (!licenseField) {
      return this.getUnknownLicense();
    }

    let licenseId: string;

    if (typeof licenseField === 'string') {
      licenseId = licenseField;
    } else if (Array.isArray(licenseField)) {
      licenseId = licenseField[0];
    } else if (licenseField.type) {
      licenseId = licenseField.type;
    } else {
      return this.getUnknownLicense();
    }

    // Clean up license ID
    licenseId = licenseId.trim().toUpperCase();

    // Map common variations
    const mappings: Record<string, string> = {
      'MIT LICENSE': 'MIT',
      'APACHE-2': 'Apache-2.0',
      'APACHE LICENSE 2.0': 'Apache-2.0',
      'BSD': 'BSD-3-Clause',
      'BSD-2': 'BSD-2-Clause',
      'BSD-3': 'BSD-3-Clause',
      'GPL': 'GPL-3.0',
      'LGPL': 'LGPL-3.0',
    };

    licenseId = mappings[licenseId] || licenseId;

    return this.licenses.get(licenseId) || this.getUnknownLicense();
  }

  /**
   * Update policy
   */
  setPolicy(policy: Partial<LicensePolicy>): void {
    this.policy = { ...this.policy, ...policy };
  }

  private buildCompatibilityMatrix(): Map<string, Set<string>> {
    const matrix = new Map<string, Set<string>>();

    // Permissive licenses are generally compatible with each other
    const permissive = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', '0BSD'];
    for (const license of permissive) {
      matrix.set(license, new Set(permissive));
    }

    // Add specific compatibilities
    // MIT can be included in GPL
    if (!matrix.has('MIT')) matrix.set('MIT', new Set());
    matrix.get('MIT')!.add('GPL-2.0');
    matrix.get('MIT')!.add('GPL-3.0');

    return matrix;
  }

  private generateSummary(dependencies: DependencyLicense[]): LicenseSummary {
    const licenseDistribution: Record<string, number> = {};
    const licenseTypes: Record<LicenseType, number> = {
      permissive: 0,
      weak_copyleft: 0,
      strong_copyleft: 0,
      public_domain: 0,
      proprietary: 0,
      unknown: 0,
    };

    let compatibleCount = 0;
    let incompatibleCount = 0;
    let unknownCount = 0;

    for (const dep of dependencies) {
      // License distribution
      const licenseId = dep.license.spdxId;
      licenseDistribution[licenseId] = (licenseDistribution[licenseId] || 0) + 1;

      // License types
      licenseTypes[dep.license.type]++;

      // Compatibility
      if (dep.license.type === 'unknown') {
        unknownCount++;
      } else if (this.policy.allowedLicenses.includes(licenseId)) {
        compatibleCount++;
      } else if (this.policy.forbiddenLicenses.includes(licenseId)) {
        incompatibleCount++;
      } else {
        compatibleCount++; // Not explicitly forbidden
      }
    }

    return {
      totalDependencies: dependencies.length,
      licenseDistribution,
      licenseTypes,
      compatibleCount,
      incompatibleCount,
      unknownCount,
    };
  }

  private findViolations(dependencies: DependencyLicense[]): LicenseViolation[] {
    const violations: LicenseViolation[] = [];

    for (const dep of dependencies) {
      const licenseId = dep.license.spdxId;

      if (this.policy.forbiddenLicenses.includes(licenseId)) {
        violations.push({
          packageName: dep.packageName,
          violation: `Uses forbidden license: ${licenseId}`,
          severity: 'critical',
          action: 'Remove dependency or obtain exception',
        });
      }

      if (dep.license.type === 'unknown') {
        violations.push({
          packageName: dep.packageName,
          violation: 'Unknown or missing license',
          severity: 'high',
          action: 'Investigate license status',
        });
      }

      if (dep.license.copyleft && !this.policy.allowCopyleft) {
        violations.push({
          packageName: dep.packageName,
          violation: `Copyleft license: ${licenseId}`,
          severity: 'medium',
          action: 'Review copyleft implications',
        });
      }
    }

    return violations;
  }

  private generateAttributions(dependencies: DependencyLicense[]): Attribution[] {
    const attributions: Attribution[] = [];

    for (const dep of dependencies) {
      if (dep.license.attribution) {
        attributions.push({
          packageName: dep.packageName,
          license: dep.license.spdxId,
          copyright: dep.copyrightNotice || 'Copyright (c) respective authors',
          attributionText: this.generateAttributionText(dep),
        });
      }
    }

    return attributions;
  }

  private generateAttributionText(dep: DependencyLicense): string {
    const license = dep.license;
    let text = `${dep.packageName} (${dep.version})\n`;
    text += `License: ${license.name}\n`;
    if (dep.copyrightNotice) {
      text += `${dep.copyrightNotice}\n`;
    }
    if (dep.repository) {
      text += `Repository: ${dep.repository}\n`;
    }
    return text;
  }

  private generateOverallRecommendations(
    compatibility: LicenseCompatibilityResult,
    violations: LicenseViolation[],
    summary: LicenseSummary
  ): string[] {
    const recommendations: string[] = [...compatibility.recommendations];

    if (summary.unknownCount > 0) {
      recommendations.push(`${summary.unknownCount} dependencies have unknown licenses - investigate`);
    }

    if (violations.some(v => v.severity === 'critical')) {
      recommendations.push('Critical license violations found - resolve before distribution');
    }

    if (summary.licenseTypes.strong_copyleft > 0) {
      recommendations.push('Review GPL license implications for distribution');
    }

    if (summary.licenseTypes.weak_copyleft > 0) {
      recommendations.push('Ensure proper dynamic linking for LGPL dependencies');
    }

    return recommendations;
  }

  private getUnknownLicense(): LicenseInfo {
    return {
      name: 'Unknown License',
      spdxId: 'UNKNOWN',
      type: 'unknown',
      permissions: [],
      limitations: [],
      conditions: [],
      commercial: false,
      attribution: false,
      copyleft: false,
      patentGrant: false,
    };
  }

  private generateId(): string {
    return `license_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Supporting interfaces
interface LicenseCompatibility {
  compatible: boolean;
  reason?: string;
  conditions?: string[];
}

// Singleton instance
let checkerInstance: LicenseChecker | null = null;

export function getLicenseChecker(): LicenseChecker {
  if (!checkerInstance) {
    checkerInstance = new LicenseChecker();
  }
  return checkerInstance;
}
