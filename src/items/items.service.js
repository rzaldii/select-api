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
exports.ItemsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
function toSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}
function mapItem(item) {
    const primaryImage = item.images?.find((image) => image.is_primary) ?? item.images?.[0];
    return {
        id: Number(item.id),
        category_id: Number(item.category_id),
        category: item.category
            ? {
                id: Number(item.category.id),
                name: item.category.name,
                slug: item.category.slug,
            }
            : null,
        name: item.name,
        slug: item.slug,
        brand: item.brand,
        model: item.model,
        serial_number: item.serial_number,
        description: item.description,
        daily_price: Number(item.daily_price),
        replacement_value: item.replacement_value
            ? Number(item.replacement_value)
            : null,
        status: item.status,
        is_active: item.is_active,
        specifications: item.specifications,
        primary_image: primaryImage
            ? {
                id: Number(primaryImage.id),
                storage_bucket: primaryImage.storage_bucket,
                storage_path: primaryImage.storage_path,
                public_url: primaryImage.public_url,
            }
            : null,
        created_at: item.created_at,
        updated_at: item.updated_at,
    };
}
function mapCategory(category) {
    return {
        id: Number(category.id),
        name: category.name,
        slug: category.slug,
        icon_name: category.icon_name,
        description: category.description,
        is_active: category.is_active,
        created_at: category.created_at,
        updated_at: category.updated_at,
    };
}
let ItemsService = class ItemsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findCategories() {
        const categories = await this.prisma.category.findMany({
            where: {
                is_active: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
        return categories.map(mapCategory);
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;
        const where = {
            is_active: true,
        };
        if (query.category_id) {
            where.category_id = BigInt(query.category_id);
        }
        if (query.status) {
            where.status = query.status;
        }
        if (query.search) {
            where.OR = [
                {
                    name: {
                        contains: query.search,
                        mode: 'insensitive',
                    },
                },
                {
                    brand: {
                        contains: query.search,
                        mode: 'insensitive',
                    },
                },
                {
                    model: {
                        contains: query.search,
                        mode: 'insensitive',
                    },
                },
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.item.findMany({
                where,
                include: {
                    category: true,
                    images: {
                        orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }],
                    },
                },
                orderBy: {
                    created_at: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.item.count({ where }),
        ]);
        return {
            items: items.map(mapItem),
            meta: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const item = await this.prisma.item.findFirst({
            where: {
                id: BigInt(id),
                is_active: true,
            },
            include: {
                category: true,
                images: {
                    orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }],
                },
            },
        });
        if (!item) {
            throw new common_1.NotFoundException('Barang tidak ditemukan');
        }
        return mapItem(item);
    }
    async create(dto, adminProfileId) {
        const category = await this.prisma.category.findFirst({
            where: {
                id: BigInt(dto.category_id),
                is_active: true,
            },
        });
        if (!category) {
            throw new common_1.BadRequestException('Kategori tidak ditemukan atau tidak aktif');
        }
        const slug = dto.slug || toSlug(dto.name);
        const existingSlug = await this.prisma.item.findUnique({
            where: {
                slug,
            },
        });
        if (existingSlug) {
            throw new common_1.BadRequestException('Slug barang sudah digunakan');
        }
        const existingSerial = await this.prisma.item.findUnique({
            where: {
                serial_number: dto.serial_number,
            },
        });
        if (existingSerial) {
            throw new common_1.BadRequestException('Serial number sudah digunakan');
        }
        const item = await this.prisma.item.create({
            data: {
                category_id: BigInt(dto.category_id),
                name: dto.name,
                slug,
                brand: dto.brand,
                model: dto.model,
                serial_number: dto.serial_number,
                description: dto.description,
                daily_price: dto.daily_price,
                replacement_value: dto.replacement_value,
                status: dto.status ?? 'available',
                is_active: dto.is_active ?? true,
                specifications: dto.specifications ?? {},
                created_by: BigInt(adminProfileId),
                updated_by: BigInt(adminProfileId),
            },
            include: {
                category: true,
                images: true,
            },
        });
        return mapItem(item);
    }
    async update(id, dto, adminProfileId) {
        const existingItem = await this.prisma.item.findUnique({
            where: {
                id: BigInt(id),
            },
        });
        if (!existingItem) {
            throw new common_1.NotFoundException('Barang tidak ditemukan');
        }
        if (dto.category_id) {
            const category = await this.prisma.category.findFirst({
                where: {
                    id: BigInt(dto.category_id),
                    is_active: true,
                },
            });
            if (!category) {
                throw new common_1.BadRequestException('Kategori tidak ditemukan atau tidak aktif');
            }
        }
        if (dto.slug && dto.slug !== existingItem.slug) {
            const existingSlug = await this.prisma.item.findUnique({
                where: {
                    slug: dto.slug,
                },
            });
            if (existingSlug) {
                throw new common_1.BadRequestException('Slug barang sudah digunakan');
            }
        }
        if (dto.serial_number &&
            dto.serial_number !== existingItem.serial_number) {
            const existingSerial = await this.prisma.item.findUnique({
                where: {
                    serial_number: dto.serial_number,
                },
            });
            if (existingSerial) {
                throw new common_1.BadRequestException('Serial number sudah digunakan');
            }
        }
        const item = await this.prisma.item.update({
            where: {
                id: BigInt(id),
            },
            data: {
                category_id: dto.category_id ? BigInt(dto.category_id) : undefined,
                name: dto.name,
                slug: dto.slug,
                brand: dto.brand,
                model: dto.model,
                serial_number: dto.serial_number,
                description: dto.description,
                daily_price: dto.daily_price,
                replacement_value: dto.replacement_value,
                status: dto.status,
                is_active: dto.is_active,
                specifications: dto.specifications,
                updated_by: BigInt(adminProfileId),
            },
            include: {
                category: true,
                images: {
                    orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }],
                },
            },
        });
        return mapItem(item);
    }
    async softDelete(id, adminProfileId) {
        const existingItem = await this.prisma.item.findUnique({
            where: {
                id: BigInt(id),
            },
        });
        if (!existingItem) {
            throw new common_1.NotFoundException('Barang tidak ditemukan');
        }
        const item = await this.prisma.item.update({
            where: {
                id: BigInt(id),
            },
            data: {
                is_active: false,
                status: 'inactive',
                updated_by: BigInt(adminProfileId),
            },
            include: {
                category: true,
                images: true,
            },
        });
        return mapItem(item);
    }
};
exports.ItemsService = ItemsService;
exports.ItemsService = ItemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ItemsService);
//# sourceMappingURL=items.service.js.map