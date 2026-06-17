import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ClientsService } from '../clients/clients.service';
import { JwtService } from '@nestjs/jwt';

const mockClientsService = {
    findOne: jest.fn(),
};

const mockJwtService = {
    signAsync: jest.fn(),
};

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: ClientsService, useValue: mockClientsService },
                { provide: JwtService, useValue: mockJwtService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    describe('signIn', () => {
        it('should return access_token when client exists', async () => {
            mockClientsService.findOne.mockResolvedValue({ id: 1, documentId: 'doc-123' });
            mockJwtService.signAsync.mockResolvedValue('jwt-token');

            const result = await service.signIn('doc-123');

            expect(mockClientsService.findOne).toHaveBeenCalledWith('doc-123');
            expect(mockJwtService.signAsync).toHaveBeenCalledWith({
                sub: 1,
                document: 'doc-123',
            });
            expect(result).toEqual({ access_token: 'jwt-token' });
        });

        it('should throw NotFoundException when client is not found', async () => {
            mockClientsService.findOne.mockResolvedValue(undefined);

            await expect(service.signIn('unknown')).rejects.toThrow(NotFoundException);
            expect(mockJwtService.signAsync).not.toHaveBeenCalled();
        });

        it('should propagate error thrown by ClientsService', async () => {
            mockClientsService.findOne.mockRejectedValue(new Error('DB error'));

            await expect(service.signIn('doc-123')).rejects.toThrow('DB error');
        });
    });
});
