# Scanalyze Medical Platform

> **Advanced Medical Diagnostics Simplified**

A comprehensive healthcare technology platform that provides cutting-edge laboratory testing and medical imaging with AI-powered analysis. Scanalyze offers fast, accurate results with secure digital health records management.

![Scanalyze Platform](https://img.shields.io/badge/Next.js-15.2.4-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38b2ac?style=for-the-badge&logo=tailwind-css)

## 🏥 About Scanalyze

Scanalyze is a modern medical diagnostic platform that bridges the gap between healthcare providers and patients through advanced technology. The platform integrates AI-powered medical imaging analysis, comprehensive laboratory testing, and secure health record management into a unified system.

### 🎯 Mission

To democratize access to advanced medical diagnostics by providing healthcare institutions and patients with cutting-edge tools for accurate, efficient, and secure medical analysis.

## ✨ Key Features

### 🔬 AI-Powered Medical Imaging

- **Brain Scan Analysis**: Advanced neural network analysis for brain imaging
- **Lung Imaging**: Dual-mode analysis for X-ray and plasma-based lung scans
- **Kidney Condition Detection**: Automated kidney health assessment
- **Retinal Screening**: Diabetic retinopathy detection and analysis
- **Knee Joint Assessment**: Orthopedic imaging analysis

### 🏥 Multi-Role Healthcare System

- **Patient Portal**: Comprehensive health record management and test results
- **Admin Dashboard**: System-wide management and oversight
- **Lab Technician Interface**: Laboratory test management and reporting
- **Scan Technician Tools**: Medical imaging upload and analysis workflow
- **Receptionist Portal**: Patient management and appointment coordination

### 🔒 Security & Compliance

- **Phone Verification**: Multi-step authentication with OTP
- **National ID Verification**: Secure identity validation
- **Role-Based Access Control**: Granular permissions for different user types
- **Secure Health Records**: HIPAA-compliant data management
- **Cookie Management**: Transparent data usage policies

### 📊 Laboratory Testing

Comprehensive test panels including:

- **Complete Blood Count (CBC)**: Full blood analysis with automated calculations
- **Diabetes Screening**: HbA1c, fasting glucose, and glucose tolerance tests
- **Kidney Function Tests**: Creatinine, BUN, eGFR calculations
- **Liver Function Panel**: Comprehensive hepatic assessment

## 🛠️ Technology Stack

### Frontend

- **Next.js 15.2.4**: React framework with App Router
- **React 19**: Latest React features and hooks
- **TypeScript 5**: Type-safe development
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Animation library (via Tailwind CSS Animate)

### UI Components & Libraries

- **Shadcn/ui**: Modern component library
- **Lucide React**: Icon library
- **TipTap**: Rich text editor for medical reports
- **Chart.js**: Data visualization for medical metrics
- **React Query**: Server state management
- **React Hook Form**: Form validation and management

### Development Tools

- **pnpm**: Fast, disk space efficient package manager
- **ESLint**: Code linting and formatting
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

### External Integrations

- **Gradio Client**: AI model integration
- **Axios**: HTTP client for API communication
- **QR Code Generation**: Patient verification and sharing
- **PDF Generation**: Medical report export
- **Image Compression**: Optimized image handling

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/scanalyze-frontend.git
   cd scanalyze-frontend
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:

   ```bash
   # API Configuration
   NEXT_PUBLIC_API_URL=your_backend_api_url
   NEXT_PUBLIC_ML_API_URL=your_ml_api_url
   NEXT_PUBLIC_APP_URL=your_app_url

   # Additional configuration variables as needed
   ```

4. **Run the development server**

   ```bash
   pnpm dev
   ```

5. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
# Create production build
pnpm build

# Start production server
pnpm start
```

## 📁 Project Structure

```
scanalyze-frontend/
├── app/                          # Next.js 13+ App Router
│   ├── (auth)/                   # Authentication routes
│   ├── (main)/                   # Main landing page
│   ├── api/                      # API routes
│   ├── dashboard/                # Role-based dashboards
│   │   ├── admin/                # Admin interface
│   │   ├── lab-technician/       # Lab technician tools
│   │   ├── patient/              # Patient portal
│   │   ├── receptionist/         # Receptionist dashboard
│   │   └── scan-technician/      # Scan technician interface
│   ├── patient/                  # Patient-specific pages
│   ├── scan/                     # Scan analysis pages
│   └── test/                     # Laboratory test pages
├── components/                   # Reusable React components
│   ├── ui/                       # Base UI components
│   ├── charts/                   # Chart components
│   ├── dialogs/                  # Modal dialogs
│   ├── data-table/               # Table components
│   └── layout/                   # Layout components
├── lib/                          # Utility libraries
│   ├── api/                      # API client functions
│   ├── context/                  # React context providers
│   ├── services/                 # External service integrations
│   └── utils/                    # Helper functions
├── hooks/                        # Custom React hooks
├── public/                       # Static assets
└── middleware.ts                 # Next.js middleware for auth
```

## 🔐 Authentication & Authorization

### User Roles

- **Patient**: Access to personal health records and test results
- **Admin**: System-wide management and user oversight
- **Lab Technician**: Laboratory test management and analysis
- **Scan Technician**: Medical imaging processing and upload
- **Receptionist**: Patient management and appointment coordination

### Authentication Flow

1. **Phone Number Verification**: OTP-based authentication
2. **National ID Validation**: Government ID verification
3. **Role Assignment**: Automatic role-based dashboard routing
4. **Session Management**: Secure cookie-based sessions

## 🔬 AI Medical Analysis

### Supported Scan Types

- **Brain Scans**: Neurological condition detection
- **Lung X-rays**: Pulmonary disease identification
- **Lung Plasma**: Advanced tissue analysis
- **Kidney Scans**: Renal function assessment
- **Retinal Images**: Diabetic retinopathy screening
- **Knee Imaging**: Joint health evaluation

### Analysis Features

- **Real-time Processing**: Instant AI analysis results
- **Rich Text Reports**: Comprehensive medical reporting with TipTap editor
- **Progress Tracking**: Live analysis status updates
- **Export Options**: PDF report generation
- **Historical Tracking**: Analysis result archiving

## 📊 Laboratory Testing

### Test Categories

- **Hematology**: Complete blood count analysis
- **Chemistry**: Metabolic panels and organ function tests
- **Endocrinology**: Hormone and diabetes testing
- **Nephrology**: Kidney function assessment
- **Hepatology**: Liver function evaluation

### Automated Calculations

- **eGFR**: Estimated Glomerular Filtration Rate
- **MCV**: Mean Corpuscular Volume
- **Reference Range Comparison**: Automated normal/abnormal flagging

## 🚀 Deployment

### Environment Variables

Ensure all required environment variables are configured in your deployment platform:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_ML_API_URL`
- `NEXT_PUBLIC_APP_URL`

## 🤝 Contributing

We welcome contributions to improve Scanalyze! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Implement proper error handling
- Add appropriate comments for complex logic
- Ensure responsive design compatibility

## 📝 License

This project is proprietary software. All rights reserved.

## 🏆 Acknowledgments

- **Next.js Team**: For the incredible React framework
- **Radix UI**: For accessible component primitives
- **Tailwind CSS**: For the utility-first CSS framework
- **Vercel**: For seamless deployment and hosting
- **Open Source Community**: For the amazing libraries and tools

---

**Scanalyze Medical Platform** - Advanced Medical Diagnostics Simplified

_Healthcare technology solutions for modern medical diagnostics._
