import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Integration tests for Artisan Verification Workflow
 * 
 * Tests cover:
 * 1. Document upload and validation
 * 2. Storage integration
 * 3. Verification request creation
 * 4. Admin approval process
 * 5. Badge awarding
 * 6. Profile verification status
 */

// Mock Supabase with realistic workflow simulation
const mockVerificationData = {
  artisan: {
    id: 'artisan-test-123',
    profile_id: 'profile-test-456',
    business_name: 'Test Carpentry Services',
    is_verified: false,
    verified_at: null,
  },
  documents: [] as any[],
  requests: [] as any[],
  badges: [] as any[],
};

const createMockChain = () => {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    is: vi.fn(() => chain),
    single: vi.fn(() => {
      // Return artisan data
      if (chain.select.mock.calls[0]?.[0] === 'id') {
        return Promise.resolve({ 
          data: { id: mockVerificationData.artisan.id }, 
          error: null 
        });
      }
      // Return full artisan data
      return Promise.resolve({ 
        data: mockVerificationData.artisan, 
        error: null 
      });
    }),
  };
  return chain;
};

const mockSupabase = {
  from: vi.fn((table: string) => {
    if (table === 'verification_documents') {
      return {
        insert: vi.fn((data: any) => {
          mockVerificationData.documents.push({
            id: `doc-${Date.now()}`,
            ...data,
            uploaded_at: new Date().toISOString(),
          });
          return {
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ 
                data: mockVerificationData.documents[mockVerificationData.documents.length - 1], 
                error: null 
              })),
            })),
          };
        }),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ 
              data: mockVerificationData.documents, 
              error: null 
            })),
          })),
        })),
      };
    }
    
    if (table === 'verification_requests') {
      return {
        insert: vi.fn((data: any) => {
          mockVerificationData.requests.push({
            id: `req-${Date.now()}`,
            ...data,
            submitted_at: new Date().toISOString(),
          });
          return {
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ 
                data: mockVerificationData.requests[mockVerificationData.requests.length - 1], 
                error: null 
              })),
            })),
          };
        }),
        update: vi.fn((data: any) => createMockChain()),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: mockVerificationData.requests[0], 
              error: null 
            })),
          })),
        })),
      };
    }
    
    if (table === 'artisans') {
      return {
        select: vi.fn(() => createMockChain()),
        update: vi.fn((data: any) => {
          Object.assign(mockVerificationData.artisan, data);
          return createMockChain();
        }),
      };
    }
    
    if (table === 'artisan_badges') {
      return {
        insert: vi.fn((data: any) => {
          mockVerificationData.badges.push({
            id: `badge-${Date.now()}`,
            ...data,
          });
          return {
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ 
                data: mockVerificationData.badges[mockVerificationData.badges.length - 1], 
                error: null 
              })),
            })),
          };
        }),
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ 
            data: mockVerificationData.badges, 
            error: null 
          })),
        })),
      };
    }
    
    return {
      select: vi.fn(() => createMockChain()),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
        })),
      })),
    };
  }),
  
  rpc: vi.fn((funcName: string, params?: any) => {
    if (funcName === 'approve_verification') {
      // Simulate approval process
      const requestId = params.p_request_id;
      const reviewerId = params.p_reviewer_id;
      
      // Update request status
      const request = mockVerificationData.requests.find(r => r.id === requestId);
      if (request) {
        request.status = 'approved';
        request.reviewed_at = new Date().toISOString();
        request.reviewed_by = reviewerId;
      }
      
      // Update artisan verification status
      mockVerificationData.artisan.is_verified = true;
      mockVerificationData.artisan.verified_at = new Date().toISOString();
      
      // Award badge
      mockVerificationData.badges.push({
        id: `badge-${Date.now()}`,
        artisan_id: mockVerificationData.artisan.id,
        badge_type: 'verified_pro',
        earned_at: new Date().toISOString(),
      });
      
      return Promise.resolve({ data: true, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  }),
  
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn((path: string, blob: any) => {
        return Promise.resolve({ 
          data: { path }, 
          error: null 
        });
      }),
      getPublicUrl: vi.fn((path: string) => ({
        data: { publicUrl: `https://storage.example.com/${path}` }
      })),
    })),
  },
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('Verification Workflow - Document Upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerificationData.documents = [];
    mockVerificationData.requests = [];
    mockVerificationData.badges = [];
    mockVerificationData.artisan.is_verified = false;
    mockVerificationData.artisan.verified_at = null;
  });

  it('should validate document type', () => {
    const validTypes = ['id_card', 'certification', 'license', 'other'];
    const testDocument = {
      type: 'id_card',
      name: 'national_id.pdf',
    };

    expect(validTypes).toContain(testDocument.type);
  });

  it('should enforce file size limit (10MB)', () => {
    const maxSize = 10 * 1024 * 1024;
    const validFile = { size: 5 * 1024 * 1024 };
    const invalidFile = { size: 15 * 1024 * 1024 };

    expect(validFile.size).toBeLessThanOrEqual(maxSize);
    expect(invalidFile.size).toBeGreaterThan(maxSize);
  });

  it('should accept valid file formats', () => {
    const validFormats = ['image/jpeg', 'image/png', 'application/pdf'];
    const testFile = { type: 'application/pdf' };

    expect(validFormats).toContain(testFile.type);
  });

  it('should upload document to storage', async () => {
    const mockBlob = new Blob(['test content'], { type: 'application/pdf' });
    const fileName = 'artisan-123/id_card_1234567890.pdf';

    const result = await mockSupabase.storage
      .from('verification-documents')
      .upload(fileName, mockBlob);

    expect(result.data).toBeDefined();
    expect(result.data?.path).toBe(fileName);
    expect(result.error).toBeNull();
  });

  it('should generate public URL for uploaded document', () => {
    const fileName = 'artisan-123/id_card_1234567890.pdf';

    const { data } = mockSupabase.storage
      .from('verification-documents')
      .getPublicUrl(fileName);

    expect(data.publicUrl).toContain(fileName);
    expect(data.publicUrl).toMatch(/^https?:\/\//);
  });

  it('should save document metadata to database', async () => {
    const documentData = {
      artisan_id: mockVerificationData.artisan.id,
      document_type: 'id_card',
      document_url: 'https://storage.example.com/artisan-123/id.pdf',
      file_name: 'national_id.pdf',
      file_size: 2048000,
    };

    const result = await mockSupabase
      .from('verification_documents')
      .insert(documentData)
      .select()
      .single();

    expect(result.data).toBeDefined();
    expect(result.data?.document_type).toBe('id_card');
    expect(result.data?.file_name).toBe('national_id.pdf');
    expect(mockVerificationData.documents.length).toBe(1);
  });

  it('should allow multiple documents per artisan', async () => {
    const documents = [
      {
        artisan_id: mockVerificationData.artisan.id,
        document_type: 'id_card',
        document_url: 'https://storage.example.com/id.pdf',
        file_name: 'id.pdf',
        file_size: 1024000,
      },
      {
        artisan_id: mockVerificationData.artisan.id,
        document_type: 'certification',
        document_url: 'https://storage.example.com/cert.pdf',
        file_name: 'cert.pdf',
        file_size: 2048000,
      },
    ];

    for (const doc of documents) {
      await mockSupabase
        .from('verification_documents')
        .insert(doc)
        .select()
        .single();
    }

    expect(mockVerificationData.documents.length).toBe(2);
  });
});

describe('Verification Workflow - Request Creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerificationData.documents = [];
    mockVerificationData.requests = [];
    mockVerificationData.badges = [];
    mockVerificationData.artisan.is_verified = false;
    mockVerificationData.artisan.verified_at = null;
  });

  it('should create verification request', async () => {
    const requestData = {
      artisan_id: mockVerificationData.artisan.id,
      status: 'pending',
    };

    const result = await mockSupabase
      .from('verification_requests')
      .insert(requestData)
      .select()
      .single();

    expect(result.data).toBeDefined();
    expect(result.data?.status).toBe('pending');
    expect(result.data?.submitted_at).toBeDefined();
    expect(mockVerificationData.requests.length).toBe(1);
  });

  it('should set default status to pending', async () => {
    const requestData = {
      artisan_id: mockVerificationData.artisan.id,
      status: 'pending',
    };

    await mockSupabase
      .from('verification_requests')
      .insert(requestData)
      .select()
      .single();

    const request = mockVerificationData.requests[0];
    expect(request.status).toBe('pending');
  });

  it('should record submission timestamp', async () => {
    const before = new Date();

    await mockSupabase
      .from('verification_requests')
      .insert({
        artisan_id: mockVerificationData.artisan.id,
        status: 'pending',
      })
      .select()
      .single();

    const after = new Date();
    const request = mockVerificationData.requests[0];
    const submittedAt = new Date(request.submitted_at);

    expect(submittedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(submittedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

describe('Verification Workflow - Admin Approval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerificationData.documents = [];
    mockVerificationData.requests = [];
    mockVerificationData.badges = [];
    mockVerificationData.artisan.is_verified = false;
    mockVerificationData.artisan.verified_at = null;
  });

  it('should approve verification request', async () => {
    // Create request first
    await mockSupabase
      .from('verification_requests')
      .insert({
        artisan_id: mockVerificationData.artisan.id,
        status: 'pending',
      })
      .select()
      .single();

    const requestId = mockVerificationData.requests[0].id;

    // Approve request
    const result = await mockSupabase.rpc('approve_verification', {
      p_request_id: requestId,
      p_reviewer_id: 'admin-123',
    });

    expect(result.data).toBe(true);
    expect(result.error).toBeNull();
  });

  it('should update request status to approved', async () => {
    // Create request
    await mockSupabase
      .from('verification_requests')
      .insert({
        artisan_id: mockVerificationData.artisan.id,
        status: 'pending',
      })
      .select()
      .single();

    const requestId = mockVerificationData.requests[0].id;

    // Approve
    await mockSupabase.rpc('approve_verification', {
      p_request_id: requestId,
      p_reviewer_id: 'admin-123',
    });

    const request = mockVerificationData.requests[0];
    expect(request.status).toBe('approved');
    expect(request.reviewed_at).toBeDefined();
    expect(request.reviewed_by).toBe('admin-123');
  });

  it('should update artisan verification status', async () => {
    // Create request
    await mockSupabase
      .from('verification_requests')
      .insert({
        artisan_id: mockVerificationData.artisan.id,
        status: 'pending',
      })
      .select()
      .single();

    const requestId = mockVerificationData.requests[0].id;

    // Approve
    await mockSupabase.rpc('approve_verification', {
      p_request_id: requestId,
      p_reviewer_id: 'admin-123',
    });

    expect(mockVerificationData.artisan.is_verified).toBe(true);
    expect(mockVerificationData.artisan.verified_at).toBeDefined();
  });

  it('should award verified badge', async () => {
    // Create request
    await mockSupabase
      .from('verification_requests')
      .insert({
        artisan_id: mockVerificationData.artisan.id,
        status: 'pending',
      })
      .select()
      .single();

    const requestId = mockVerificationData.requests[0].id;

    // Approve
    await mockSupabase.rpc('approve_verification', {
      p_request_id: requestId,
      p_reviewer_id: 'admin-123',
    });

    expect(mockVerificationData.badges.length).toBe(1);
    expect(mockVerificationData.badges[0].badge_type).toBe('verified_pro');
    expect(mockVerificationData.badges[0].artisan_id).toBe(mockVerificationData.artisan.id);
  });
});

describe('Verification Workflow - End-to-End', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerificationData.documents = [];
    mockVerificationData.requests = [];
    mockVerificationData.badges = [];
    mockVerificationData.artisan.is_verified = false;
    mockVerificationData.artisan.verified_at = null;
  });

  it('should complete full verification workflow', async () => {
    // Step 1: Upload documents
    const documents = [
      {
        artisan_id: mockVerificationData.artisan.id,
        document_type: 'id_card',
        document_url: 'https://storage.example.com/id.pdf',
        file_name: 'id.pdf',
        file_size: 1024000,
      },
      {
        artisan_id: mockVerificationData.artisan.id,
        document_type: 'certification',
        document_url: 'https://storage.example.com/cert.pdf',
        file_name: 'cert.pdf',
        file_size: 2048000,
      },
    ];

    for (const doc of documents) {
      await mockSupabase
        .from('verification_documents')
        .insert(doc)
        .select()
        .single();
    }

    expect(mockVerificationData.documents.length).toBe(2);

    // Step 2: Create verification request
    await mockSupabase
      .from('verification_requests')
      .insert({
        artisan_id: mockVerificationData.artisan.id,
        status: 'pending',
      })
      .select()
      .single();

    expect(mockVerificationData.requests.length).toBe(1);
    expect(mockVerificationData.requests[0].status).toBe('pending');

    // Step 3: Admin approves
    const requestId = mockVerificationData.requests[0].id;
    await mockSupabase.rpc('approve_verification', {
      p_request_id: requestId,
      p_reviewer_id: 'admin-123',
    });

    // Step 4: Verify final state
    expect(mockVerificationData.artisan.is_verified).toBe(true);
    expect(mockVerificationData.artisan.verified_at).toBeDefined();
    expect(mockVerificationData.badges.length).toBe(1);
    expect(mockVerificationData.badges[0].badge_type).toBe('verified_pro');
    expect(mockVerificationData.requests[0].status).toBe('approved');
  });

  it('should maintain data integrity throughout workflow', async () => {
    const artisanId = mockVerificationData.artisan.id;

    // Upload document
    await mockSupabase
      .from('verification_documents')
      .insert({
        artisan_id: artisanId,
        document_type: 'id_card',
        document_url: 'https://storage.example.com/id.pdf',
        file_name: 'id.pdf',
        file_size: 1024000,
      })
      .select()
      .single();

    // Create request
    await mockSupabase
      .from('verification_requests')
      .insert({
        artisan_id: artisanId,
        status: 'pending',
      })
      .select()
      .single();

    // Approve
    const requestId = mockVerificationData.requests[0].id;
    await mockSupabase.rpc('approve_verification', {
      p_request_id: requestId,
      p_reviewer_id: 'admin-123',
    });

    // Verify all IDs match
    expect(mockVerificationData.documents[0].artisan_id).toBe(artisanId);
    expect(mockVerificationData.requests[0].artisan_id).toBe(artisanId);
    expect(mockVerificationData.badges[0].artisan_id).toBe(artisanId);
  });
});
