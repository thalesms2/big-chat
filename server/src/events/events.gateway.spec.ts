import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { EventsGateway } from './events.gateway';

describe('EventsGateway', () => {
    let gateway: EventsGateway;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventsGateway,
                { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
            ],
        }).compile();

        gateway = module.get<EventsGateway>(EventsGateway);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });
});
