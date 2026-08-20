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
      let response: Response;

      // Detect if target is MARITIME_API (FastAPI expecting multipart/form-data)
      const isFastApi = functionUrl.includes('/api/v1') || functionUrl.includes(':8000');

      if (isFastApi) {
        const formData = new FormData();

        if (file && typeof file !== 'string') {
          formData.append('file', file, fileName);
        } else if (base64Data) {
          // Convert base64 string to Blob for FormData
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          formData.append('file', blob, fileName);
        } else if (textContent) {
          const blob = new Blob([textContent], { type: 'text/plain' });
          formData.append('file', blob, 'extracted_text.txt');
        }

        if (destinations && destinations.length > 0) {
          formData.append('destinations', JSON.stringify(destinations));
        }
        if (this.config.modelName) {
          formData.append('model', this.config.modelName);
        }

        response = await fetch(functionUrl, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Cloud Functions JSON format
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

        response = await fetch(functionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Universal Reader HTTP Error [${response.status}]: ${errText}`);
      }

      const resultData = await response.json();

      const rawClassification = isFastApi ? resultData.classification : resultData.classification;
      const detectedMetadata = (rawClassification?.caseMetadata || rawClassification?.metadata || {}) as Record<string, any>;

      // Perform local case matching scoring against casesList
      const proposals: CaseProposal<C>[] = [];
      const weights = fieldWeights || { vessel: 40, imo: 35, port: 15, client: 10 };

      if (casesList && casesList.length > 0) {
        for (const c of casesList) {
          let score = 0;
          const reasons: string[] = [];

          // Compare vessel name
          const vesselVal = (c as any).vessel || (c as any).vesselName || (c as any).name;
          const detectedVessel = detectedMetadata.vessel || detectedMetadata.vessel_name || detectedMetadata.ship;
          if (vesselVal && detectedVessel) {
            const sim = levenshteinSimilarity(String(vesselVal), String(detectedVessel));
            if (sim > 0.7) {
              score += Math.round(sim * (weights.vessel || 40));
              reasons.push(`Vessel name match (${Math.round(sim * 100)}%)`);
            }
          }

          // Compare IMO
          const imoVal = (c as any).imo || (c as any).imoNumber;
          const detectedImo = detectedMetadata.imo || detectedMetadata.imo_number;
          if (imoVal && detectedImo) {
            const sim = levenshteinSimilarity(String(imoVal), String(detectedImo));
            if (sim > 0.85) {
              score += (weights.imo || 35);
              reasons.push(`IMO match (${String(imoVal)})`);
            }
          }

          // Compare Port
          const portVal = (c as any).port || (c as any).portName;
          const detectedPort = detectedMetadata.port || detectedMetadata.port_name;
          if (portVal && detectedPort) {
            const sim = levenshteinSimilarity(String(portVal), String(detectedPort));
            if (sim > 0.7) {
              score += Math.round(sim * (weights.port || 15));
              reasons.push(`Port match (${String(portVal)})`);
            }
          }

          // Compare Client / Principal
          const clientVal = (c as any).client || (c as any).clientName || (c as any).principal;
          const detectedClient = detectedMetadata.client || detectedMetadata.client_name || detectedMetadata.principal || detectedMetadata.principal_name;
          if (clientVal && detectedClient) {
            const sim = levenshteinSimilarity(String(clientVal), String(detectedClient));
            if (sim > 0.7) {
              score += Math.round(sim * (weights.client || 10));
              reasons.push(`Client match (${String(clientVal)})`);
            }
          }

          const caseId = (c as any).id || (c as any).caseId || '';
          const label = `${(c as any).vessel || 'Vessel'} • ${(c as any).port || 'Port'} (${caseId})${score > 0 ? ` [${score}% Match]` : ''}`;

          proposals.push({
            entityId: caseId,
            entityData: c,
            caseId,
            caseData: c,
            matchScore: score,
            matchReasons: reasons,
            formattedLabel: label
          });
        }

        // Sort descending by match score
        proposals.sort((a, b) => b.matchScore - a.matchScore);
      }

      const topSuggested = proposals.length > 0 && proposals[0].matchScore >= 30 ? proposals[0] : undefined;

      const normalizedResult: UniversalReaderResult<T, C> = {
        classification: {
          destinationId: rawClassification?.destinationId || rawClassification?.destination_id || 'other',
          destinationName: rawClassification?.destinationName || rawClassification?.destination_name || 'Generic Document',
          confidence: rawClassification?.confidence || 0.9,
          reasoning: rawClassification?.reasoning || rawClassification?.classificationNote || rawClassification?.classification_note || '',
          classificationNote: rawClassification?.classificationNote || rawClassification?.classification_note || rawClassification?.rationale || '',
          caseMetadata: detectedMetadata,
        },
        caseProposals: proposals,
        suggestedCase: topSuggested,
        extractedData: (isFastApi ? resultData.extracted_data : resultData.extractedData) || ({} as T)
      };

      return normalizedResult;

    }

    throw new Error('No functionUrl specified for UniversalReaderEngine client.');
  }
}


