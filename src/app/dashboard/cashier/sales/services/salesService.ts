import {
  productsService,
  PaginatedProductsResponse,
} from "@/app/services/products";
import { customersService } from "@/app/services/customers";
import { taxesService } from "@/app/services/taxes";
import { businessPaymentMethodsService } from "@/app/services/business-payment-methods";
import { shiftsService } from "@/app/services/shifts";
import { ordersService } from "@/app/services/orders";
import { TableOrdersService } from "@/services/table-orders";
import { PhysicalTablesService } from "@/services/physical-tables";

export class SalesService {
  static async loadProducts(
    businessId: string,
    page: number = 1,
    searchTerm?: string,
    selectedCategory?: string,
    productsPerPage: number = 20
  ): Promise<PaginatedProductsResponse> {
    return await productsService.getPaginated({
      businessId,
      page: page - 1, // Backend uses 0-based pagination
      limit: productsPerPage,
      search: searchTerm || undefined,
      categoryName: selectedCategory || undefined,
    });
  }

  static async loadAllProducts(
    businessId: string
  ): Promise<PaginatedProductsResponse> {
    return await productsService.getPaginated({
      businessId,
      page: 0,
      limit: 1000, // Get a large number to have all products available
    });
  }

  static async loadCategories(businessId: string): Promise<any[]> {
    const response = await productsService.getPaginated({
      businessId,
      page: 0,
      limit: 1000,
    });

    const uniqueCategories = [
      ...new Set(response.products.map((p) => p.categoryName).filter(Boolean)),
    ];
    return uniqueCategories.map((name) => ({ id: name, name }));
  }

  static async loadCustomers(): Promise<any> {
    return await customersService.getCustomers(1, 100);
  }

  static async loadTaxes(businessId: string): Promise<any[]> {
    return await taxesService.getByBusinessId(businessId);
  }

  static async loadPaymentMethods(): Promise<any[]> {
    return await businessPaymentMethodsService.getBusinessPaymentMethods();
  }

  static async loadActiveShift(userId: string): Promise<any> {
    return await shiftsService.getActiveShift(userId);
  }

  static async loadExistingOrder(orderId: string): Promise<any> {
    return await ordersService.getOrder(orderId);
  }

  static async loadTableOrder(tableOrderId: string): Promise<any> {
    return await TableOrdersService.getTableOrder(tableOrderId);
  }

  static async loadAvailablePhysicalTables(): Promise<any[]> {
    return await PhysicalTablesService.getAvailablePhysicalTables();
  }

  static async loadExistingTables(): Promise<any[]> {
    return await TableOrdersService.getActiveTableOrders();
  }

  static async createOrder(orderData: any): Promise<any> {
    return await ordersService.createOrder(orderData);
  }

  static async addItemToOrder(orderId: string, itemData: any): Promise<any> {
    return await ordersService.addItem(orderId, itemData);
  }

  static async updateItemQuantity(
    orderId: string,
    itemId: string,
    quantity: number
  ): Promise<any> {
    return await ordersService.updateItemQuantity(orderId, itemId, quantity);
  }

  static async removeItemFromOrder(
    orderId: string,
    itemId: string
  ): Promise<any> {
    return await ordersService.removeItem(orderId, itemId);
  }

  static async updateOrder(orderId: string, updateData: any): Promise<any> {
    return await ordersService.updateOrder(orderId, updateData);
  }

  static async clearOrderItems(orderId: string): Promise<any> {
    return await ordersService.clearOrderItems(orderId);
  }

  static async confirmOrder(orderId: string, notes: string): Promise<any> {
    return await ordersService.confirmOrder(orderId, notes);
  }

  static async processPayment(paymentData: any): Promise<any> {
    return await ordersService.processPayment(paymentData);
  }

  static async completeOrder(
    orderId: string,
    completionData: any
  ): Promise<any> {
    return await ordersService.completeOrder(orderId, completionData);
  }

  static async cancelOrder(orderId: string): Promise<any> {
    return await ordersService.cancelOrder(orderId);
  }

  static async updateTip(orderId: string, tipPercentage: number): Promise<any> {
    return await ordersService.updateTip(orderId, tipPercentage);
  }

  static async createTableOrder(tableOrderData: any): Promise<any> {
    return await TableOrdersService.createTableOrder(tableOrderData);
  }

  static async closeTableOrder(tableOrderId: string): Promise<any> {
    return await TableOrdersService.closeTableOrder(tableOrderId);
  }

  static async getActiveTableOrderByPhysicalTableId(
    physicalTableId: string
  ): Promise<any> {
    return await TableOrdersService.getActiveTableOrderByPhysicalTableId(
      physicalTableId
    );
  }
}
