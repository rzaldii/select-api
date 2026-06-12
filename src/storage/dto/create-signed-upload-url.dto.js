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
exports.CreateSignedUploadUrlDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateSignedUploadUrlDto {
}
exports.CreateSignedUploadUrlDto = CreateSignedUploadUrlDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'identity-documents',
        enum: [
            'item-images',
            'profile-photos',
            'identity-documents',
            'condition-photos',
            'review-media',
        ],
    }),
    (0, class_validator_1.IsIn)([
        'item-images',
        'profile-photos',
        'identity-documents',
        'condition-photos',
        'review-media',
    ]),
    __metadata("design:type", String)
], CreateSignedUploadUrlDto.prototype, "bucket", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'ktp/SEL-2026-0005/ktp-iqbal.png',
        description: 'Path file di Supabase Storage',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[a-zA-Z0-9/_\-.]+$/, {
        message: 'path hanya boleh berisi huruf, angka, slash, underscore, strip, dan titik',
    }),
    __metadata("design:type", String)
], CreateSignedUploadUrlDto.prototype, "path", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'image/png',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSignedUploadUrlDto.prototype, "content_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSignedUploadUrlDto.prototype, "upsert", void 0);
//# sourceMappingURL=create-signed-upload-url.dto.js.map