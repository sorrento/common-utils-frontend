import {
  ClassificationDestination,
  ExtractedMetadata,
  ClassificationResult,
  MatchEntityProposal,
  CaseProposal,
  GenericExtractionSchema,
  UniversalReaderDebugInfo,
  UniversalReaderConfig,
  UniversalReaderProcessOptions,
  UniversalReaderResult
} from '../../../common-utils-shared';

export type {
  ClassificationDestination,
  ExtractedMetadata,
  ClassificationResult,
  MatchEntityProposal,
  CaseProposal,
  GenericExtractionSchema,
  UniversalReaderDebugInfo,
  UniversalReaderConfig,
  UniversalReaderProcessOptions,
  UniversalReaderResult
};

export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const lenA = a.length;
  const lenB = b.length;

  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;

  for (let i = 0; i <= lenB; i++) matrix[i] = [i];
  for (let j = 0; j <= lenA; j++) matrix[0][j] = j;

  for (let i = 1; i <= lenB; i++) {
    for (let j = 1; j <= lenA; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[lenB][lenA];
}

export function levenshteinSimilarity(str1?: string, str2?: string): number {
  if (!str1 || !str2) return 0;
  const s1 = String(str1).toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  const s2 = String(str2).toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;

  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    return Math.max(0.85, minLen / maxLen);
  }

  const dist = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  return maxLen === 0 ? 1.0 : Math.max(0, (maxLen - dist) / maxLen);
}

export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string; fileName: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      const base64 = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
      resolve({
        base64,
        mimeType: file.type || 'application/pdf',
        fileName: file.name
      });
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

export class UniversalReaderEngine {
  private config: UniversalReaderConfig;

  constructor(config: UniversalReaderConfig = {}) {
    this.config = {
      modelName: 'gemini-2.0-flash',
      ...config
    };
  }

  public getConfig(): UniversalReaderConfig {
    return this.config;
  }

  public async classifyDocument(options: UniversalReaderProcessOptions): Promise<ClassificationResult> {
    const res = await this.processUniversalPool(options);
    return res.classification;
  }

  public async processUniversalPool<T = Record<string, any>, C = any>(
    options: UniversalReaderProcessOptions
  ): Promise<UniversalReaderResult<T, C>> {
    const {
      file,
      fileBase64: inputBase64,
      mimeType: inputMime,
      textContent,
      fileName: inputFileName,
      destinations = this.config.destinations || [],
      schemas = this.config.schemas || {},
      casesList = [],
      fieldWeights = this.config.fieldWeights || {}
    } = options;

    let base64Data = inputBase64 || '';
    let mimeType = inputMime || 'application/pdf';
    let fileName = inputFileName || 'document.pdf';

    if (file && typeof file !== 'string') {
      const converted = await fileToBase64(file);
      base64Data = converted.base64;
      mimeType = converted.mimeType;
      fileName = converted.fileName;
    } else if (typeof file === 'string') {
      base64Data = file;
    }

    const payload = {
      fileBase64: base64Data,
      mimeType,
      textContent,
      fileName,
      additionalContext: options.additionalContext,
      destinations,
      schemas,
      systemRole: this.config.systemRole,
      metadataFields: this.config.metadataFields,
      fieldWeights
    };

    const functionUrl = this.config.functionUrl;
    if (functionUrl) {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Universal Reader HTTP Error [${response.status}]: ${errText}`);
      }

      const resultData = await response.json();
      return resultData as UniversalReaderResult<T, C>;
    }

    throw new Error('No functionUrl specified for UniversalReaderEngine client.');
  }
}
