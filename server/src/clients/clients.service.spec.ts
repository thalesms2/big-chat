import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DocumentType, Plan } from '@prisma/client';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma.service';

const mockPrisma = {
    client: {
        create: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findFirstOrThrow: jest.fn(),
        update: jest.fn(),
    },
};

describe('ClientsService', () => {
    let service: ClientsService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ClientsService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<ClientsService>(ClientsService);
    });

    describe('create', () => {
        it('should create and return a client', async () => {
            const client = {
                id: 1,
                name: 'João',
                documentId: '111.111.111-11',
                documentType: DocumentType.CPF,
                planType: Plan.PREPAID,
                active: true,
                balance: 0,
                limit: 0,
            };
            mockPrisma.client.create.mockResolvedValue(client);

            const result = await service.create('João', '111.111.111-11', 'cpf', 'prepaid');

            expect(mockPrisma.client.create).toHaveBeenCalledWith({
                data: {
                    name: 'João',
                    documentId: '111.111.111-11',
                    documentType: DocumentType.CPF,
                    planType: Plan.PREPAID,
                    active: true,
                },
            });
            expect(result).toEqual(client);
        });

        it('should uppercase documentType and planType before persisting', async () => {
            mockPrisma.client.create.mockResolvedValue({});

            await service.create('Empresa', '00.000.000/0001-00', 'cnpj', 'pospaid');

            expect(mockPrisma.client.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        documentType: DocumentType.CNPJ,
                        planType: Plan.POSPAID,
                    }),
                }),
            );
        });
    });

    describe('findOne', () => {
        it('should return a client by documentId', async () => {
            const client = { id: 1, documentId: 'doc-123' };
            mockPrisma.client.findUniqueOrThrow.mockResolvedValue(client);

            const result = await service.findOne('doc-123');

            expect(mockPrisma.client.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { documentId: 'doc-123' },
            });
            expect(result).toEqual(client);
        });

        it('should propagate error when client not found', async () => {
            mockPrisma.client.findUniqueOrThrow.mockRejectedValue(new Error('Not found'));

            await expect(service.findOne('unknown')).rejects.toThrow('Not found');
        });
    });

    describe('getBalance', () => {
        it('should query balance by documentId', async () => {
            mockPrisma.client.findFirstOrThrow.mockResolvedValue({ balance: 1500 });

            await service.getBalance('doc-123');

            expect(mockPrisma.client.findFirstOrThrow).toHaveBeenCalledWith({
                where: { documentId: 'doc-123' },
                select: { balance: true },
            });
        });

        it('should propagate error when client not found', async () => {
            mockPrisma.client.findFirstOrThrow.mockRejectedValue(new Error('Not found'));

            await expect(service.getBalance('unknown')).rejects.toThrow('Not found');
        });
    });

    describe('update', () => {
        it('should update name', async () => {
            const updated = { id: 1, name: 'Novo Nome' };
            mockPrisma.client.update.mockResolvedValue(updated);

            const result = await service.update('doc-123', 'Novo Nome');

            expect(mockPrisma.client.update).toHaveBeenCalledWith({
                where: { documentId: 'doc-123' },
                data: { name: 'Novo Nome' },
            });
            expect(result).toEqual(updated);
        });

        it('should uppercase planType before persisting', async () => {
            mockPrisma.client.update.mockResolvedValue({});

            await service.update('doc-123', undefined, 'pospaid');

            expect(mockPrisma.client.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ planType: Plan.POSPAID }),
                }),
            );
        });

        it('should set active to false when action is deactivate', async () => {
            mockPrisma.client.update.mockResolvedValue({ active: false });

            await service.update('doc-123', undefined, undefined, 'deactivate');

            expect(mockPrisma.client.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ active: false }),
                }),
            );
        });

        it('should add value to current balance when action is balance', async () => {
            mockPrisma.client.findFirstOrThrow.mockResolvedValue({ balance: 500 });
            mockPrisma.client.update.mockResolvedValue({ balance: 1500 });

            await service.update('doc-123', undefined, undefined, 'balance', 1000);

            expect(mockPrisma.client.findFirstOrThrow).toHaveBeenCalledWith({
                where: { documentId: 'doc-123' },
            });
            expect(mockPrisma.client.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ balance: 1500 }),
                }),
            );
        });

        it('should throw BadRequestException when action is balance but value is undefined', async () => {
            await expect(
                service.update('doc-123', undefined, undefined, 'balance', undefined),
            ).rejects.toThrow(BadRequestException);

            expect(mockPrisma.client.update).not.toHaveBeenCalled();
        });

        it('should update name and planType simultaneously', async () => {
            mockPrisma.client.update.mockResolvedValue({});

            await service.update('doc-123', 'Novo Nome', 'prepaid');

            expect(mockPrisma.client.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        name: 'Novo Nome',
                        planType: Plan.PREPAID,
                    }),
                }),
            );
        });
    });
});
