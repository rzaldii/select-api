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
exports.CreateIdentityVerificationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateIdentityVerificationDto {
}
exports.CreateIdentityVerificationDto = CreateIdentityVerificationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateIdentityVerificationDto.prototype, "booking_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'ktp' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], CreateIdentityVerificationDto.prototype, "document_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Iqbal Rizaldi' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateIdentityVerificationDto.prototype, "ktp_name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '3509********0002' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], CreateIdentityVerificationDto.prototype, "ktp_number_masked", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ktp/SEL-2026-0001/ktp-iqbal.png' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIdentityVerificationDto.prototype, "photo_path", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: -8.164846 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], CreateIdentityVerificationDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 113.715 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], CreateIdentityVerificationDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Jl. Kalimantan, Sumbersari, Jember' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIdentityVerificationDto.prototype, "address_text", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-06-01T10:20:00.000Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateIdentityVerificationDto.prototype, "taken_at", void 0);
//# sourceMappingURL=create-identity-verification.dto.js.map