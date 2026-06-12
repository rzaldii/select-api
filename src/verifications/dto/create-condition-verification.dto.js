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
exports.CreateConditionVerificationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateConditionVerificationDto {
}
exports.CreateConditionVerificationDto = CreateConditionVerificationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateConditionVerificationDto.prototype, "booking_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateConditionVerificationDto.prototype, "item_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'before_rent',
        enum: ['before_rent', 'after_rent'],
    }),
    (0, class_validator_1.IsIn)(['before_rent', 'after_rent']),
    __metadata("design:type", String)
], CreateConditionVerificationDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'condition/SEL-2026-0001/item-before.png' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConditionVerificationDto.prototype, "photo_path", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: -8.164846 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], CreateConditionVerificationDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 113.715 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], CreateConditionVerificationDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Jl. Kalimantan, Sumbersari, Jember' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConditionVerificationDto.prototype, "address_text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Kondisi barang baik, kelengkapan sesuai.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConditionVerificationDto.prototype, "note", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-06-10T08:30:00.000Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateConditionVerificationDto.prototype, "taken_at", void 0);
//# sourceMappingURL=create-condition-verification.dto.js.map