"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemsModule = void 0;
const common_1 = require("@nestjs/common");
const roles_guard_1 = require("../common/guards/roles.guard");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const items_controller_1 = require("./items.controller");
const items_service_1 = require("./items.service");
let ItemsModule = class ItemsModule {
};
exports.ItemsModule = ItemsModule;
exports.ItemsModule = ItemsModule = __decorate([
    (0, common_1.Module)({
        controllers: [items_controller_1.ItemsController],
        providers: [items_service_1.ItemsService, supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard],
    })
], ItemsModule);
//# sourceMappingURL=items.module.js.map