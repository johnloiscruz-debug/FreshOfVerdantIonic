import { ChangeDetectorRef, Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonMenuButton } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { barChartOutline, cartOutline, cubeOutline, peopleOutline, pricetagOutline, storefrontOutline, warningOutline, closeOutline, imageOutline, starOutline, mailOutline } from 'ionicons/icons';
import { ApiService, AdminCategory, AdminCategoryCount, AdminComplaint, AdminCustomer, AdminCustomerOrder, AdminDashboardData, AdminOrder, AdminOrderDetail, AdminOverview, AdminProduct, AdminReport } from '../../services/api';
import { AuthService } from '../../services/auth';
import { ProductService } from '../../services/product';

type AdminSection = 'dashboard' | 'products' | 'orders' | 'customers' | 'reviews' | 'complaints' | 'categories';
interface ProductForm { id: number | null; name: string; description: string; price: number; stockQuantity: number; unit: string; categoryId: number | null; imageUrl: string | null; isActive: boolean; }

@Component({
  selector: 'app-admin', standalone: true, imports: [IonContent, IonIcon, IonMenuButton, FormsModule],
  templateUrl: './admin.page.html', styleUrls: ['./admin.page.scss'],
})
export class AdminPage {
  readonly orderStatuses = ['Pending', 'Processing', 'Packed', 'Out for Delivery', 'Delivered', 'Completed', 'Cancelled'];
  readonly emptyOverview: AdminOverview = { orderCount: 0, salesTotal: 0, pendingOrders: 0, processingOrders: 0, completedOrders: 0, cancelledOrders: 0, productCount: 0, lowStockCount: 0, customerCount: 0, reviewCount: 0, complaintCount: 0 };
  activeSection: AdminSection = 'dashboard';
  overview: AdminOverview = { ...this.emptyOverview };
  products: AdminProduct[] = [];
  orders: AdminOrder[] = [];
  dashboardLowStock: AdminDashboardData['lowStock'] = [];
  customers: AdminCustomer[] = [];
  complaints: AdminComplaint[] = [];
  categories: AdminCategory[] = [];
  categoryCounts: AdminCategoryCount[] = [
    { category_name: 'Fruits', product_count: 0 },
    { category_name: 'Vegetables', product_count: 0 },
    { category_name: 'Grains', product_count: 0 },
    { category_name: 'Others', product_count: 0 },
  ];
  report: AdminReport | null = null;
  orderDetail: AdminOrderDetail | null = null;
  selectedCustomer: AdminCustomer | null = null;
  customerOrders: AdminCustomerOrder[] = [];
  productSearch = '';
  customerSearch = '';
  orderFilter = 'all';
  reportFrom = '';
  reportTo = '';
  loading = false;
  loadFailed = false;
  savingId = '';
  message = '';
  error = '';
  productForm: ProductForm = this.blankProduct();
  showProductForm = false;
  categoryForm = { id: null as number | null, name: '', description: '' };
  showCategoryForm = false;
  private loadTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private api: ApiService, public auth: AuthService, private route: ActivatedRoute, private router: Router, private productService: ProductService, private changeDetector: ChangeDetectorRef) {
    addIcons({ barChartOutline, cartOutline, cubeOutline, peopleOutline, pricetagOutline, storefrontOutline, warningOutline, closeOutline, imageOutline, starOutline, mailOutline });
    this.route.queryParamMap.subscribe((params) => {
      const section = params.get('section') as AdminSection | null;
      this.activeSection = section && ['products', 'orders', 'customers', 'reviews', 'complaints', 'categories'].includes(section) ? section : 'dashboard';
      this.loadSection();
    });
  }

  get visibleProducts() {
    const query = this.productSearch.trim().toLocaleLowerCase();
    return this.products.filter((product) => !query || product.product_name.toLocaleLowerCase().includes(query) || (product.category_name ?? '').toLocaleLowerCase().includes(query));
  }

  get visibleCustomers() {
    const query = this.customerSearch.trim().toLocaleLowerCase();
    return this.customers.filter((customer) => !query || customer.full_name.toLocaleLowerCase().includes(query) || customer.email.toLocaleLowerCase().includes(query) || (customer.username ?? '').toLocaleLowerCase().includes(query));
  }

  get visibleOrders() {
    return this.orders.filter((order) => this.orderFilter === 'all' || this.statusGroup(order.order_status) === this.orderFilter);
  }

  get recentOrders() { return this.orders.slice(0, 5); }
  get lowStockProducts() { return this.dashboardLowStock.slice(0, 5); }

  setSection(section: AdminSection) {
    this.message = '';
    this.error = '';
    void this.router.navigate([], { relativeTo: this.route, queryParams: { section: section === 'dashboard' ? null : section }, queryParamsHandling: 'merge' });
  }

  viewCustomerStore() {
    this.auth.setAdminCustomerMode(true);
    void this.router.navigateByUrl('/home');
  }

  loadSection() {
    this.loading = true;
    this.loadFailed = false;
    this.error = '';
    if (this.loadTimer) clearTimeout(this.loadTimer);
    this.loadTimer = setTimeout(() => {
      if (!this.loading) return;
      this.loading = false;
      this.loadFailed = true;
      this.error = 'IPTBACKEND did not respond within 12 seconds. Check that the backend is running at localhost:3000, then retry.';
      this.changeDetector.detectChanges();
    }, 12000);
    if (this.activeSection === 'products') {
      let pending = 2;
      let requestFailed = false;
      const finish = (failed = false) => { requestFailed ||= failed; if (--pending === 0) this.finishLoading(requestFailed); };
      this.api.adminProducts().subscribe({ next: (rows) => { this.products = rows; finish(); }, error: (failure) => { this.error = this.apiFailure(failure, 'products'); finish(true); } });
      this.api.adminCategories().subscribe({ next: (rows) => { this.categories = rows; finish(); }, error: (failure) => { this.error = this.apiFailure(failure, 'categories'); finish(true); } });
    } else if (this.activeSection === 'orders') {
      this.api.adminOrders().subscribe({ next: (rows) => { this.orders = rows; this.finishLoading(); }, error: (failure) => { this.error = this.apiFailure(failure, 'orders'); this.finishLoading(true); } });
    } else if (this.activeSection === 'customers') {
      this.api.adminCustomers().subscribe({ next: (rows) => { this.customers = rows; this.finishLoading(); }, error: (failure) => { this.error = this.apiFailure(failure, 'customers'); this.finishLoading(true); } });
    } else if (this.activeSection === 'complaints') {
      this.api.adminComplaints().subscribe({ next: (rows) => { this.complaints = rows; this.finishLoading(); }, error: (failure) => { this.error = this.apiFailure(failure, 'complaints'); this.finishLoading(true); } });
    } else if (this.activeSection === 'categories') {
      let pending = 2;
      let requestFailed = false;
      const finish = (failed = false) => { requestFailed ||= failed; if (--pending === 0) this.finishLoading(requestFailed); };
      this.api.adminCategories().subscribe({ next: (rows) => { this.categories = rows; finish(); }, error: (failure) => { this.error = this.apiFailure(failure, 'categories'); finish(true); } });
      this.api.adminCategoryCounts().subscribe({ next: (rows) => { this.categoryCounts = rows; finish(); }, error: (failure) => { this.error = this.apiFailure(failure, 'category counts'); finish(true); } });
    } else if (this.activeSection === 'reviews') {
      this.loadReport();
    } else {
      this.api.adminDashboard().subscribe({
        next: (data) => { this.overview = data.overview; this.orders = data.orders; this.dashboardLowStock = data.lowStock; this.finishLoading(); },
        error: (failure) => { this.error = this.apiFailure(failure, 'dashboard'); this.finishLoading(true); },
      });
    }
  }

  startNewProduct() {
    this.productForm = this.blankProduct();
    this.showProductForm = true;
    this.message = '';
    this.error = '';
  }

  editProduct(product: AdminProduct) {
    this.productForm = { id: product.product_id, name: product.product_name, description: product.description ?? '', price: product.price, stockQuantity: product.stock_quantity, unit: product.unit, categoryId: product.category_id, imageUrl: product.image_url, isActive: product.is_active };
    this.showProductForm = true;
    this.message = '';
    this.error = '';
  }

  async chooseProductImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) {
      this.error = 'Choose an image smaller than 8 MB.';
      return;
    }
    try {
      const source = await this.fileDataUrl(file);
      const image = await this.loadImage(source);
      const scale = Math.min(1, 900 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Image processing unavailable');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/jpeg', 0.8);
      if (data.length > 740000) throw new Error('Image file is too large after processing');
      this.productForm.imageUrl = data;
      this.error = '';
    } catch {
      this.error = 'Could not process that image. Please choose another image.';
    }
  }

  saveProductForm() {
    const form = this.productForm;
    if (!form.name.trim() || !form.unit.trim() || form.price < 0 || form.stockQuantity < 0 || !form.categoryId) {
      this.error = 'Enter a product name, unit, category, valid price, and stock quantity.';
      return;
    }
    this.savingId = form.id ? `product-${form.id}` : 'new-product';
    this.error = '';
    this.message = '';
    const onSuccess = () => { this.message = form.id ? 'Product changes saved.' : 'Product added to the store.'; this.showProductForm = false; this.savingId = ''; this.loadProducts(); this.productService.load(); this.loadOverview(); };
    const onFailure = (failure: HttpErrorResponse) => { this.error = failure.error?.error ?? 'Could not save product changes.'; this.savingId = ''; };
    if (form.id) {
      this.api.updateAdminProduct({ product_id: form.id, product_name: form.name.trim(), description: form.description, price: Number(form.price), stock_quantity: Number(form.stockQuantity), unit: form.unit.trim(), image_url: form.imageUrl, category_id: form.categoryId, is_active: form.isActive }).subscribe({ next: onSuccess, error: onFailure });
    } else {
      this.api.createAdminProduct({ product_name: form.name.trim(), description: form.description, price: Number(form.price), stock_quantity: Number(form.stockQuantity), unit: form.unit.trim(), image_url: form.imageUrl, category_id: form.categoryId }).subscribe({ next: onSuccess, error: onFailure });
    }
  }

  deactivateProduct(product: AdminProduct) {
    this.savingId = `product-${product.product_id}`;
    this.api.updateAdminProduct({ ...product, is_active: false }).subscribe({
      next: () => { this.message = `${product.product_name} is now hidden from the store.`; this.savingId = ''; this.loadProducts(); this.productService.load(); this.loadOverview(); },
      error: () => { this.error = `Could not deactivate ${product.product_name}.`; this.savingId = ''; },
    });
  }

  saveOrder(order: AdminOrder) {
    this.savingId = `order-${order.order_id}`;
    this.message = '';
    this.error = '';
    this.api.updateAdminOrder(order.order_id, order.order_status).subscribe({
      next: () => { this.message = `Order #${order.order_id} was updated.`; this.savingId = ''; this.loadOverview(); },
      error: (failure) => { this.error = failure.error?.error ?? `Could not update order #${order.order_id}.`; this.savingId = ''; },
    });
  }

  viewOrder(orderId: number) {
    this.orderDetail = null;
    this.api.adminOrderDetail(orderId).subscribe({ next: (detail) => { this.orderDetail = detail; }, error: () => { this.error = 'Could not load order details.'; } });
  }

  toggleCustomer(customer: AdminCustomer) {
    const previous = customer.account_status;
    customer.account_status = previous === 'Active' ? 'Inactive' : 'Active';
    this.savingId = `customer-${customer.user_id}`;
    this.error = '';
    this.api.updateAdminCustomer(customer.user_id, customer.account_status).subscribe({
      next: () => { this.message = `${customer.full_name}'s account is ${customer.account_status.toLowerCase()}.`; this.savingId = ''; },
      error: (failure) => { customer.account_status = previous; this.error = failure.error?.error ?? `Could not update ${customer.full_name}'s account.`; this.savingId = ''; },
    });
  }

  viewCustomerOrders(customer: AdminCustomer) {
    this.selectedCustomer = customer;
    this.customerOrders = [];
    this.api.adminCustomerOrders(customer.user_id).subscribe({ next: (rows) => { this.customerOrders = rows; }, error: () => { this.error = 'Could not load this customer’s order history.'; } });
  }

  startNewCategory() { this.categoryForm = { id: null, name: '', description: '' }; this.showCategoryForm = true; }
  editCategory(category: AdminCategory) { this.categoryForm = { id: category.category_id, name: category.category_name, description: category.description ?? '' }; this.showCategoryForm = true; }

  saveCategory() {
    const name = this.categoryForm.name.trim();
    if (!name) { this.error = 'Enter a category name.'; return; }
    this.savingId = this.categoryForm.id ? `category-${this.categoryForm.id}` : 'new-category';
    const onSuccess = () => { this.message = this.categoryForm.id ? 'Category updated.' : 'Category added.'; this.showCategoryForm = false; this.savingId = ''; this.loadCategories(); this.productService.load(); };
    const onFailure = (failure: HttpErrorResponse) => { this.error = failure.error?.error ?? 'Could not save category.'; this.savingId = ''; };
    if (this.categoryForm.id) this.api.updateAdminCategory({ category_id: this.categoryForm.id, category_name: name, description: this.categoryForm.description }).subscribe({ next: onSuccess, error: onFailure });
    else this.api.createAdminCategory(name, this.categoryForm.description).subscribe({ next: onSuccess, error: onFailure });
  }

  deleteCategory(category: AdminCategory) {
    this.api.deleteAdminCategory(category.category_id).subscribe({ next: () => { this.message = `${category.category_name} deleted.`; this.loadCategories(); this.productService.load(); }, error: (failure) => { this.error = failure.error?.error ?? 'Could not delete category.'; } });
  }

  loadReport() {
    this.loading = true;
    if (this.loadTimer) clearTimeout(this.loadTimer);
    this.loadTimer = setTimeout(() => {
      if (!this.loading) return;
      this.error = 'IPTBACKEND did not respond within 12 seconds. Check that the backend is running at localhost:3000, then retry.';
      this.finishLoading(true);
      this.changeDetector.detectChanges();
    }, 12000);
    this.api.adminReports().subscribe({ next: (report) => { this.report = report; this.finishLoading(); }, error: (failure) => { this.error = this.apiFailure(failure, 'reviews'); this.finishLoading(true); } });
  }

  statusGroup(status: string) {
    const normalized = status.trim().toLocaleLowerCase();
    if (normalized === 'cancelled' || normalized === 'canceled') return 'cancelled';
    if (['delivered', 'completed'].includes(normalized)) return 'completed';
    if (['packed', 'out for delivery', 'processing', 'preparing'].includes(normalized)) return 'processing';
    return 'pending';
  }

  money(value: number) { return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(value || 0); }
  formatDate(value: string) { return value ? new Date(value.replace(' ', 'T') + (value.includes('Z') ? '' : 'Z')).toLocaleString() : '—'; }
  closeOrderDetail() { this.orderDetail = null; }
  closeCustomerHistory() { this.selectedCustomer = null; }

  private blankProduct(): ProductForm { return { id: null, name: '', description: '', price: 0, stockQuantity: 0, unit: 'kg', categoryId: null, imageUrl: null, isActive: true }; }
  private finishLoading(failed = false) {
    if (this.loadTimer) clearTimeout(this.loadTimer);
    this.loadTimer = null;
    this.loading = false;
    this.loadFailed = failed;
    if (!failed) this.error = '';
  }
  private apiFailure(failure: HttpErrorResponse, resource: string) {
    if (failure.status === 0) return `Cannot reach IPTBACKEND while loading ${resource}. Start the backend at localhost:3000 and retry.`;
    if (failure.status === 401 || failure.status === 403) return `IPTBACKEND rejected access to ${resource}. Sign in again with an Admin account.`;
    if (failure.status === 404) return `IPTBACKEND does not have the ${resource} endpoint. Restart the backend and retry.`;
    return failure.error?.error ?? `Could not load ${resource} from IPTBACKEND (HTTP ${failure.status || 'error'}).`;
  }
  private fileDataUrl(file: File) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Invalid image')); reader.onerror = () => reject(new Error('Could not read image')); reader.readAsDataURL(file); }); }
  private loadImage(source: string) { return new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('Invalid image')); image.src = source; }); }
  private loadOverview() { this.api.adminOverview().subscribe({ next: (overview) => { this.overview = overview; } }); }
  private loadProducts() { this.api.adminProducts().subscribe({ next: (rows) => { this.products = rows; } }); }
  private loadCategories() {
    this.api.adminCategories().subscribe({ next: (rows) => { this.categories = rows; } });
    this.api.adminCategoryCounts().subscribe({ next: (rows) => { this.categoryCounts = rows; } });
  }
}
