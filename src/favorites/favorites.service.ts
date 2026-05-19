import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';

function mapFavorite(favorite: any) {
  const item = favorite.item;
  const primaryImage =
    item?.images?.find((image: any) => image.is_primary) ?? item?.images?.[0];

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

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async addFavorite(itemId: number, user: AuthenticatedUser) {
    const item = await this.prisma.item.findFirst({
      where: {
        id: BigInt(itemId),
        is_active: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Barang tidak ditemukan');
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

  async removeFavorite(itemId: number, user: AuthenticatedUser) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        user_id_item_id: {
          user_id: BigInt(user.profile.id),
          item_id: BigInt(itemId),
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Barang tidak ada di favorit');
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

  async findMyFavorites(user: AuthenticatedUser) {
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
}