import { ChangeDetectorRef, Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonMenuButton, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { barChartOutline, cartOutline, cubeOutline, peopleOutline, pricetagOutline, storefrontOutline, warningOutline, closeOutline, imageOutline, starOutline, mailOutline, searchOutline } from 'ionicons/icons';
import { TimeoutError } from 'rxjs';
import { ApiService, AdminCategory, AdminCategoryCount, AdminComplaint, AdminCustomer, AdminCustomerOrder, AdminDashboardData, AdminOrder, AdminOrderDetail, AdminOverview, AdminProduct, AdminReport } from '../../services/api';
import { AuthService } from '../../services/auth';
import { ProductService } from '../../services/product';

type AdminSection = 'dashboard' | 'products' | 'orders' | 'customers' | 'reviews' | 'complaints' | 'categories';
interface ProductForm { id: number | null; name: string; description: string; price: number; stockQuantity: number; unit: string; categoryId: number | null; imageUrl: string | null; isActive: boolean; }
interface ComplaintForm { id: number | null; name: string; email: string; subject: string; message: string; status: string; resolution: string; }
interface ReviewForm { id: number | null; rating: number; comment: string; }

@Component({
  selector: 'app-admin', standalone: true, imports: [IonContent, IonIcon, IonMenuButton, FormsModule],
  templateUrl: './admin.page.html', styleUrls: ['./admin.page.scss'],
})
export class AdminPage {
  readonly orderStatuses = ['Pending', 'Processing', 'Packed', 'Out for Delivery', 'Delivered', 'Completed', 'Cancelled'];
  readonly emptyOverview: AdminOverview = { orderCount: 0, salesTotal: 0, pendingOrders: 0, processingOrders: 0, completedOrders: 0, cancelledOrders: 0, productCount: 0, lowStockCount: 0, customerCount: 0, reviewCount: 0, complaintCount: 0 };
  activeSection: AdminSection = 'dashboard';
  private readonly loadedSections = new Set<AdminSection>();
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
  reviewForm: ReviewForm = { id: null, rating: 5, comment: '' };
  showReviewForm = false;
  orderDetail: AdminOrderDetail | null = null;
  selectedCustomer: AdminCustomer | null = null;
  customerOrders: AdminCustomerOrder[] = [];
  productSearch = '';
  customerSearch = '';
  orderSearch = '';
  reviewSearch = '';
  complaintSearch = '';
  categorySearch = '';
  orderFilter = 'all';
  reportFrom = '';
  reportTo = '';
  loading = false;
  loadFailed = false;
  savingId = '';
  categoriesLoading = false;
  saveCompleteId = '';
  message = '';
  error = '';
  productForm: ProductForm = this.blankProduct();
  showProductForm = false;
  categoryForm = { id: null as number | null, name: '', description: '' };
  showCategoryForm = false;
  complaintForm: ComplaintForm = this.blankComplaint();
  showComplaintForm = false;
  private loadTimer: ReturnType<typeof setTimeout> | null = null;
  private loadSequence = 0;
  private pendingProductFormAction: (() => void) | null = null;

  constructor(private api: ApiService, public auth: AuthService, private route: ActivatedRoute, private router: Router, private productService: ProductService, private changeDetector: ChangeDetectorRef, private toastCtrl: ToastController) {
    addIcons({ barChartOutline, cartOutline, cubeOutline, peopleOutline, pricetagOutline, storefrontOutline, warningOutline, closeOutline, imageOutline, starOutline, mailOutline, searchOutline });
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
    const query = this.orderSearch.trim().toLocaleLowerCase();
    return this.orders.filter((order) => (this.orderFilter === 'all' || this.statusGroup(order.order_status) === this.orderFilter) && (!query || `${order.order_id} ${order.customer_name} ${order.shipping_address} ${order.order_status}`.toLocaleLowerCase().includes(query)));
  }

  get visibleComplaints() {
    const query = this.complaintSearch.trim().toLocaleLowerCase();
    return this.complaints.filter((complaint) => !query || `${complaint.name} ${complaint.email} ${complaint.subject} ${complaint.message} ${complaint.status} ${complaint.resolution ?? ''}`.toLocaleLowerCase().includes(query));
  }

  get visibleCategories() {
    const query = this.categorySearch.trim().toLocaleLowerCase();
    return this.categories.filter((category) => !query || `${category.category_name} ${category.description ?? ''}`.toLocaleLowerCase().includes(query));
  }

  get productCategoryOptions(): AdminCategory[] {
    return this.categories;
  }

  get visibleReviews() {
    const query = this.reviewSearch.trim().toLocaleLowerCase();
    return (this.report?.reviews ?? []).filter((review) => !query || `${review.author} ${review.product_name ?? ''} ${review.comment_text ?? ''} ${review.rating_stars}`.toLocaleLowerCase().includes(query));
  }

  get recentOrders() { return this.orders.slice(0, 5); }
  get lowStockProducts() { return this.dashboardLowStock.slice(0, 5); }
  isSectionLoaded(section = this.activeSection) { return this.loadedSections.has(section); }

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
    const loadId = ++this.loadSequence;
    this.loading = true;
    this.loadFailed = false;
    this.error = '';
    if (this.loadTimer) clearTimeout(this.loadTimer);
    this.loadTimer = setTimeout(() => {
      if (loadId !== this.loadSequence || !this.loading) return;
      this.loading = false;
      this.loadFailed = true;
      this.error = 'IPTBACKEND did not respond within 12 seconds. Check that the backend is running at localhost:3000, then retry.';
      this.changeDetector.detectChanges();
    }, 12000);
    if (this.activeSection === 'products') {
      let pending = 2;
      let requestFailed = false;
      const finish = (failed = false) => { requestFailed ||= failed; if (--pending === 0) this.finishLoading(requestFailed, loadId); };
      this.api.adminProducts().subscribe({ next: (rows) => { this.products = rows; this.loadedSections.add('products'); if (loadId === this.loadSequence) this.changeDetector.detectChanges(); finish(); }, error: (failure) => { if (loadId === this.loadSequence) this.error = this.apiFailure(failure, 'products'); finish(true); } });
      this.categoriesLoading = true;
      this.api.adminCategories().subscribe({ next: (rows) => { this.setLoadedCategories(rows); finish(); }, error: (failure) => { this.failCategoryLoad(failure); if (loadId === this.loadSequence) this.error = this.apiFailure(failure, 'categories'); finish(true); } });
    } else if (this.activeSection === 'orders') {
      this.api.adminOrders().subscribe({ next: (rows) => { this.orders = rows; this.loadedSections.add('orders'); this.finishLoading(false, loadId); }, error: (failure) => { if (loadId === this.loadSequence) this.error = this.apiFailure(failure, 'orders'); this.finishLoading(true, loadId); } });
    } else if (this.activeSection === 'customers') {
      this.api.adminCustomers().subscribe({ next: (rows) => { this.customers = rows; this.loadedSections.add('customers'); this.finishLoading(false, loadId); }, error: (failure) => { if (loadId === this.loadSequence) this.error = this.apiFailure(failure, 'customers'); this.finishLoading(true, loadId); } });
    } else if (this.activeSection === 'complaints') {
      this.api.adminComplaints().subscribe({ next: (rows) => { this.complaints = rows; this.loadedSections.add('complaints'); this.finishLoading(false, loadId); }, error: (failure) => { if (loadId === this.loadSequence) this.error = this.apiFailure(failure, 'complaints'); this.finishLoading(true, loadId); } });
    } else if (this.activeSection === 'categories') {
      let pending = 2;
      let requestFailed = false;
      const finish = (failed = false) => { requestFailed ||= failed; if (--pending === 0) this.finishLoading(requestFailed, loadId); };
      this.categoriesLoading = true;
      this.api.adminCategories().subscribe({ next: (rows) => { this.setLoadedCategories(rows); if (loadId === this.loadSequence) this.changeDetector.detectChanges(); finish(); }, error: (failure) => { this.failCategoryLoad(failure); if (loadId === this.loadSequence) this.error = this.apiFailure(failure, 'categories'); finish(true); } });
      this.api.adminCategoryCounts().subscribe({ next: (rows) => { this.categoryCounts = rows; finish(); }, error: (failure) => { if (loadId === this.loadSequence) this.error = this.apiFailure(failure, 'category counts'); finish(true); } });
    } else if (this.activeSection === 'reviews') {
      this.loadReport(loadId);
    } else {
      this.api.adminDashboard().subscribe({
        next: (data) => { this.overview = data.overview; this.orders = data.orders; this.dashboardLowStock = data.lowStock; this.loadedSections.add('dashboard'); this.finishLoading(false, loadId); },
        error: (failure) => { if (loadId === this.loadSequence) this.error = this.apiFailure(failure, 'dashboard'); this.finishLoading(true, loadId); },
      });
    }
  }

  startNewProduct() {
    this.message = '';
    this.error = '';
    this.ensureProductCategories(() => {
      this.productForm = this.blankProduct();
      this.saveCompleteId = '';
      this.showProductForm = true;
    });
  }

  editProduct(product: AdminProduct) {
    this.message = '';
    this.error = '';
    this.ensureProductCategories(() => {
      const categoryId = this.categories.some((category) => Number(category.category_id) === Number(product.category_id))
        ? Number(product.category_id)
        : null;
      this.productForm = { id: product.product_id, name: product.product_name, description: product.description ?? '', price: product.price, stockQuantity: product.stock_quantity, unit: product.unit, categoryId, imageUrl: product.image_url, isActive: product.is_active };
      this.saveCompleteId = '';
      this.showProductForm = true;
    });
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
      const image = await createImageBitmap(file);
      const scale = Math.min(1, 640 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Image processing unavailable');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      image.close();
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Image compression failed')), 'image/jpeg', 0.65));
      const data = await this.fileDataUrl(blob);
      if (data.length > 260000) throw new Error('Image file is too large after processing');
      this.productForm.imageUrl = data;
      this.error = '';
    } catch {
      this.error = 'Could not process that image. Please choose another image.';
    }
  }

  saveProductForm() {
    const form = this.productForm;
    const categoryId = Number(form.categoryId);
    if (!form.name.trim() || !form.unit.trim() || form.price < 0 || form.stockQuantity < 0 || !Number.isSafeInteger(categoryId) || !this.categories.some((category) => Number(category.category_id) === categoryId)) {
      this.error = 'Enter a product name, unit, category, valid price, and stock quantity.';
      return;
    }
    this.savingId = form.id ? `product-${form.id}` : 'new-product';
    const saveKey = this.savingId;
    const previousProducts = this.products;
    const temporaryId = -Date.now();
    const categoryName = this.productCategoryOptions.find((category) => Number(category.category_id) === categoryId)?.category_name ?? null;
    const optimisticProduct: AdminProduct = {
      product_id: form.id ?? temporaryId,
      product_name: form.name.trim(),
      description: form.description,
      price: Number(form.price),
      stock_quantity: Number(form.stockQuantity),
      unit: form.unit.trim(),
      image_url: form.imageUrl,
      category_id: categoryId,
      category_name: categoryName,
      is_active: form.isActive,
    };
    this.products = form.id
      ? this.products.map((product) => product.product_id === form.id ? optimisticProduct : product)
      : [optimisticProduct, ...this.products];
    this.error = '';
    const successMessage = form.id ? 'Update Complete' : 'Product Added';
    this.message = '';
    this.saveCompleteId = '';
    this.changeDetector.detectChanges();
    const onSuccess = (createdProductId?: number) => {
      this.message = successMessage;
      this.saveCompleteId = saveKey;
      this.savingId = '';
      this.clearSaveCompleteAfterDelay(saveKey);
      this.showProductForm = false;
      this.productForm = this.blankProduct();
      if (createdProductId) this.products = this.products.map((product) => product.product_id === temporaryId ? { ...product, product_id: createdProductId } : product);
      this.loadProducts();
      this.productService.load();
      this.loadOverview();
      void this.showSaveToast(successMessage, 'success');
    };
    const onFailure = (failure: HttpErrorResponse) => {
      this.products = previousProducts;
      this.message = '';
      this.error = this.apiFailure(failure, 'product save');
      this.savingId = '';
      this.saveCompleteId = '';
      void this.showSaveToast(this.error, 'danger');
    };
    if (form.id) {
      this.api.updateAdminProduct({ product_id: form.id, product_name: form.name.trim(), description: form.description, price: Number(form.price), stock_quantity: Number(form.stockQuantity), unit: form.unit.trim(), image_url: form.imageUrl, category_id: categoryId, is_active: form.isActive }).subscribe({ next: () => onSuccess(), error: onFailure });
    } else {
      this.api.createAdminProduct({ product_name: form.name.trim(), description: form.description, price: Number(form.price), stock_quantity: Number(form.stockQuantity), unit: form.unit.trim(), image_url: form.imageUrl, category_id: categoryId }).subscribe({ next: ({ productId }) => onSuccess(productId), error: onFailure });
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

  startNewCategory() { this.categoryForm = { id: null, name: '', description: '' }; this.saveCompleteId = ''; this.showCategoryForm = true; }
  editCategory(category: AdminCategory) { this.categoryForm = { id: category.category_id, name: category.category_name, description: category.description ?? '' }; this.saveCompleteId = ''; this.showCategoryForm = true; }

  saveCategory() {
    const name = this.categoryForm.name.trim();
    if (!name) { this.error = 'Enter a category name.'; return; }
    this.savingId = this.categoryForm.id ? `category-${this.categoryForm.id}` : 'new-category';
    const saveKey = this.savingId;
    const onSuccess = () => { this.message = 'Update Complete'; this.saveCompleteId = saveKey; this.savingId = ''; this.clearSaveCompleteAfterDelay(saveKey); this.loadCategories(); this.productService.load(); };
    const onFailure = (failure: HttpErrorResponse) => { this.error = this.apiFailure(failure, 'category save'); this.savingId = ''; };
    if (this.categoryForm.id) this.api.updateAdminCategory({ category_id: this.categoryForm.id, category_name: name, description: this.categoryForm.description }).subscribe({ next: onSuccess, error: onFailure });
    else this.api.createAdminCategory(name, this.categoryForm.description).subscribe({ next: onSuccess, error: onFailure });
  }

  deleteCategory(category: AdminCategory) {
    this.savingId = `category-${category.category_id}`;
    this.api.deleteAdminCategory(category.category_id).subscribe({ next: () => { this.message = `${category.category_name} deleted.`; this.savingId = ''; this.loadCategories(); this.productService.load(); }, error: (failure) => { this.error = failure.error?.error ?? 'Could not delete category.'; this.savingId = ''; } });
  }

  startNewComplaint() { this.complaintForm = this.blankComplaint(); this.saveCompleteId = ''; this.showComplaintForm = true; this.message = ''; this.error = ''; }
  editComplaint(complaint: AdminComplaint) { this.complaintForm = { id: complaint.complaint_id, name: complaint.name, email: complaint.email, subject: complaint.subject, message: complaint.message, status: complaint.status, resolution: complaint.resolution ?? '' }; this.saveCompleteId = ''; this.showComplaintForm = true; this.message = ''; this.error = ''; }

  saveComplaint() {
    const form = this.complaintForm;
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) { this.error = 'Complete the customer, email, subject, and message fields.'; return; }
    if (form.id && form.status === 'Resolved' && !form.resolution.trim()) { this.error = 'Enter the resolution before marking this complaint as resolved.'; return; }
    this.savingId = form.id ? `complaint-${form.id}` : 'new-complaint';
    const saveKey = this.savingId;
    this.error = '';
    const onSuccess = () => { this.message = 'Update Complete'; this.saveCompleteId = saveKey; this.savingId = ''; this.clearSaveCompleteAfterDelay(saveKey); this.loadSection(); };
    const onFailure = (failure: HttpErrorResponse) => { this.error = this.apiFailure(failure, 'complaint update'); this.savingId = ''; };
    if (form.id) {
      const complaint = this.complaints.find((item) => item.complaint_id === form.id);
      if (!complaint) { this.error = 'Complaint no longer exists. Refresh and try again.'; this.savingId = ''; return; }
      this.api.updateAdminComplaint({ ...complaint, name: form.name.trim(), email: form.email.trim(), subject: form.subject.trim(), message: form.message.trim(), status: form.status, resolution: form.resolution.trim() || null }).subscribe({ next: onSuccess, error: onFailure });
    } else {
      this.api.createAdminComplaint({ name: form.name.trim(), email: form.email.trim(), subject: form.subject.trim(), message: form.message.trim() }).subscribe({ next: onSuccess, error: onFailure });
    }
  }

  deleteComplaint(complaint: AdminComplaint) {
    this.savingId = `complaint-${complaint.complaint_id}`;
    this.api.deleteAdminComplaint(complaint.complaint_id).subscribe({ next: () => { this.message = `Complaint #${complaint.complaint_id} deleted.`; this.savingId = ''; this.loadSection(); }, error: (failure) => { this.error = failure.error?.error ?? 'Could not delete complaint.'; this.savingId = ''; } });
  }

  editReview(review: AdminReport['reviews'][number]) {
    this.reviewForm = { id: review.review_id, rating: review.rating_stars, comment: review.comment_text ?? '' };
    this.showReviewForm = true;
    this.message = '';
    this.error = '';
  }

  saveReview() {
    const form = this.reviewForm;
    if (!form.id || !Number.isInteger(form.rating) || form.rating < 1 || form.rating > 5 || form.comment.trim().length > 2000) {
      this.error = 'Choose a rating from 1 to 5 and keep the review under 2,000 characters.';
      return;
    }
    const previousReport = this.report;
    this.savingId = `review-${form.id}`;
    this.message = '';
    this.error = '';
    if (this.report) this.report = { ...this.report, reviews: this.report.reviews.map((review) => review.review_id === form.id ? { ...review, rating_stars: form.rating, comment_text: form.comment.trim() || null } : review) };
    this.api.updateAdminReview(form.id, form.rating, form.comment.trim()).subscribe({
      next: () => { this.message = 'Update Complete'; this.savingId = ''; this.showReviewForm = false; this.loadReport(); },
      error: (failure) => { this.report = previousReport; this.error = this.apiFailure(failure, 'review update'); this.savingId = ''; },
    });
  }

  deleteReview(review: AdminReport['reviews'][number]) {
    if (!this.report) return;
    const previousReport = this.report;
    this.savingId = `review-${review.review_id}`;
    this.error = '';
    this.report = { ...this.report, reviews: this.report.reviews.filter((item) => item.review_id !== review.review_id) };
    this.api.deleteAdminReview(review.review_id).subscribe({
      next: () => { this.message = 'Review deleted.'; this.savingId = ''; this.loadReport(); },
      error: (failure) => { this.report = previousReport; this.error = failure.error?.error ?? 'Could not delete the review.'; this.savingId = ''; },
    });
  }

  loadReport(loadId = this.loadSequence) {
    this.loading = true;
    if (this.loadTimer) clearTimeout(this.loadTimer);
    this.loadTimer = setTimeout(() => {
      if (loadId !== this.loadSequence || !this.loading) return;
      this.error = 'IPTBACKEND did not respond within 12 seconds. Check that the backend is running at localhost:3000, then retry.';
      this.finishLoading(true, loadId);
      this.changeDetector.detectChanges();
    }, 12000);
    this.api.adminReports().subscribe({ next: (report) => { this.report = report; this.loadedSections.add('reviews'); this.finishLoading(false, loadId); }, error: (failure) => { if (loadId === this.loadSequence) this.error = this.apiFailure(failure, 'reviews'); this.finishLoading(true, loadId); } });
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
  private blankComplaint(): ComplaintForm { return { id: null, name: '', email: '', subject: '', message: '', status: 'Pending', resolution: '' }; }
  private clearSaveCompleteAfterDelay(saveKey: string) {
    setTimeout(() => { if (this.saveCompleteId === saveKey) this.saveCompleteId = ''; }, 2500);
  }
  private async showSaveToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2400, position: 'bottom', color, cssClass: 'admin-success-toast' });
    await toast.present();
  }
  private finishLoading(failed = false, loadId = this.loadSequence) {
    if (loadId !== this.loadSequence) return;
    if (this.loadTimer) clearTimeout(this.loadTimer);
    this.loadTimer = null;
    this.loading = false;
    this.loadFailed = failed;
    if (!failed) this.error = '';
  }
  private apiFailure(failure: HttpErrorResponse | TimeoutError, resource: string) {
    if (failure instanceof TimeoutError) return `IPTBACKEND did not respond within 20 seconds while saving ${resource}. Check the backend/Turso connection, then refresh before retrying.`;
    if (failure.status === 0) return `Cannot reach IPTBACKEND while loading ${resource}. Start the backend at localhost:3000 and retry.`;
    if (failure.status === 401 || failure.status === 403) return `IPTBACKEND rejected access to ${resource}. Sign in again with an Admin account.`;
    if (failure.status === 404) return `IPTBACKEND does not have the ${resource} endpoint. Restart the backend and retry.`;
    return failure.error?.error ?? `Could not load ${resource} from IPTBACKEND (HTTP ${failure.status || 'error'}).`;
  }
  private fileDataUrl(file: Blob) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Invalid image')); reader.onerror = () => reject(new Error('Could not read image')); reader.readAsDataURL(file); }); }
  private loadImage(source: string) { return new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('Invalid image')); image.src = source; }); }
  private loadOverview() { this.api.adminOverview().subscribe({ next: (overview) => { this.overview = overview; } }); }
  private loadProducts() { this.api.adminProducts().subscribe({ next: (rows) => { this.products = rows; } }); }
  private ensureProductCategories(onReady: () => void) {
    if (this.loadedSections.has('categories')) {
      if (this.categories.length) onReady();
      else this.error = 'No product categories are available. Add a category before creating or editing a product.';
      return;
    }

    this.pendingProductFormAction = onReady;
    if (this.categoriesLoading) return;
    this.categoriesLoading = true;
    this.api.adminCategories().subscribe({
      next: (rows) => this.setLoadedCategories(rows),
      error: (failure) => this.failCategoryLoad(failure),
    });
  }
  private loadCategories() {
    this.categoriesLoading = true;
    this.api.adminCategories().subscribe({ next: (rows) => this.setLoadedCategories(rows), error: (failure) => this.failCategoryLoad(failure) });
    this.api.adminCategoryCounts().subscribe({ next: (rows) => { this.categoryCounts = rows; } });
  }

  private setLoadedCategories(rows: AdminCategory[]) {
    this.categories = rows;
    this.loadedSections.add('categories');
    this.categoriesLoading = false;
    const pendingAction = this.pendingProductFormAction;
    this.pendingProductFormAction = null;
    if (!pendingAction) return;
    if (rows.length) pendingAction();
    else this.error = 'No product categories are available. Add a category before creating or editing a product.';
  }

  private failCategoryLoad(failure: HttpErrorResponse | TimeoutError) {
    this.categoriesLoading = false;
    this.pendingProductFormAction = null;
    this.error = this.apiFailure(failure, 'categories');
  }
}
