"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const profile_mapper_1 = require("../common/mappers/profile.mapper");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMe(profileId) {
        const profile = await this.prisma.profile.findUnique({
            where: {
                id: BigInt(profileId),
            },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profil tidak ditemukan');
        }
        return (0, profile_mapper_1.mapProfile)(profile);
    }
    async updateMe(profileId, dto) {
        const profile = await this.prisma.profile.update({
            where: {
                id: BigInt(profileId),
            },
            data: {
                full_name: dto.full_name,
                phone: dto.phone,
                avatar_path: dto.avatar_path,
            },
        });
        return (0, profile_mapper_1.mapProfile)(profile);
    }
    async findAllUsers() {
        const users = await this.prisma.profile.findMany({
            orderBy: {
                created_at: 'desc',
            },
        });
        return users.map(profile_mapper_1.mapProfile);
    }
    async updateUserRole(id, dto) {
        const profile = await this.prisma.profile.update({
            where: {
                id: BigInt(id),
            },
            data: {
                role: dto.role,
            },
        });
        return (0, profile_mapper_1.mapProfile)(profile);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map