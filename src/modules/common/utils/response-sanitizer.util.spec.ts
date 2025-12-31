import { sanitizeResponseData } from './response-sanitizer.util';

describe('response sanitizer', () => {
  it('replaces relation ids with publicId or alias and removes internal ids', () => {
    const input = {
      id: '11111111-2222-3333-4444-555555555555',
      publicId: 'PAY_ABCDEFGH',
      bookingId: '22222222-3333-4444-5555-666666666666',
      booking: {
        id: '22222222-3333-4444-5555-666666666666',
        publicId: 'BKG_ABCDEFGH',
      },
      passengerId: '33333333-4444-5555-6666-777777777777',
      passenger: {
        id: '33333333-4444-5555-6666-777777777777',
        alias: 'pepito',
        publicId: 'USR_ABCDEFGH',
      },
      paypalOrderId: '44444444-5555-6666-7777-888888888888',
      nested: {
        driverId: '55555555-6666-7777-8888-999999999999',
        driver: {
          id: '55555555-6666-7777-8888-999999999999',
          publicId: 'DRV_ABCDEFGH',
        },
      },
    };

    const result = sanitizeResponseData(input) as Record<string, unknown>;

    expect(result.id).toBeUndefined();
    expect(result.publicId).toBe('PAY_ABCDEFGH');
    expect(result.bookingId).toBe('BKG_ABCDEFGH');
    expect(result.passengerId).toBe('pepito');
    expect(result.paypalOrderId).toBe(
      '44444444-5555-6666-7777-888888888888',
    );
    expect((result.nested as Record<string, unknown>).driverId).toBe(
      'DRV_ABCDEFGH',
    );
  });
});
