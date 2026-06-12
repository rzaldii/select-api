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
exports.FavoritesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
function mapFavorite(favorite) {
    const item = favorite.item;
    const primaryImage = item?.images?.find((image) => image.is_primary) ?? item?.images?.[0];
    return {
        user_id: Number(favorite.user_id),
        item_id: Number(favorite.item_id),
        created_at: favorite.created_at,
        item: item
            ? {
                id: Number(item.id),
                name: item.name,
                slug: item.slug,
                brand: item.brand,
                model: item.model,
                daily_price: Number(item.daily_price),
                status: item.status,
                primary_image: primaryImage
                    ? {
                        id: Number(primaryImage.id),
                        public_url: primaryImage.public_url,
                        storage_path: primaryImage.storage_path,
                    }
                    : null,
            }
            : null,
    };
}
let FavoritesService = class FavoritesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async addFavorite(itemId, user) {
        const item = await this.prisma.item.findFirst({
            where: {
                id: BigInt(itemId),
                is_active: true,
            },
        });
        if (!item) {
            throw new common_1.NotFoundException('Barang tidak ditemukan');
        }
        const favorite = await this.prisma.favorite.upsert({
            where: {
                user_id_item_id: {
                    user_id: BigInt(user.profile.id),
                    item_id: BigInt(itemId),
                },
            },
            update: {},
            create: {
                user_id: BigInt(user.profile.id),
                item_id: BigInt(itemId),
            },
            include: {
                item: {
                    include: {
                        images: true,
                    },
                },
            },
        });
        return mapFavorite(favorite);
    }
    async removeFavorite(itemId, user) {
        const favorite = await this.prisma.favorite.findUnique({
            where: {
                user_id_item_id: {
                    user_id: BigInt(user.profile.id),
                    item_id: BigInt(itemId),
                },
            },
        });
        if (!favorite) {
            throw new common_1.NotFoundException('Barang tidak ada di favorit');
        }
        await this.prisma.favorite.delete({
            where: {
                user_id_item_id: {
                    user_id: BigInt(user.profile.id),
                    item_id: BigInt(itemId),
                },
            },
        });
        return {
            removed: true,
            item_id: itemId,
        };
    }
    async findMyFavorites(user) {
        const favorites = await this.prisma.favorite.findMany({
            where: {
                user_id: BigInt(user.profile.id),
            },
            include: {
                item: {
                    include: {
                        images: true,
                    },
                },
            },
            orderBy: {
                created_at: 'desc',
            },
        });
        return favorites.map(mapFavorite);
    }
};
exports.FavoritesService = FavoritesService;
exports.FavoritesService = FavoritesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FavoritesService);
//# sourceMappingURL=favorites.service.js.map