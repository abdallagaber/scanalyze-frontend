"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  ChevronRight,
  Clock,
  ClipboardCheck,
  FileText,
  HeartPulse,
  MoveRight,
  Microscope,
  PieChart,
  Stethoscope,
  Shield,
  Menu,
  X,
  Info,
  Bell,
  AlertCircle,
  Search,
  UserCircle,
  ChevronUp,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getCookie } from "cookies-next";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleSections, setVisibleSections] = useState<string[]>([]);
  const [cookieConsentShown, setCookieConsentShown] = useState(false);
  const sectionRefs = {
    services: useRef(null),
    features: useRef(null),
    testimonials: useRef(null),
    contact: useRef(null),
  };

  useEffect(() => {
    // Check for authentication token in cookies
    const token = getCookie("token");
    const role = getCookie("role") as string | null;

    if (token) {
      setIsAuthenticated(true);
      setUserRole(role);
    }

    // Simulate content loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const header = document.getElementById("header");

    // Function to handle scroll events
    const handleScroll = () => {
      // Handle header shadow on scroll
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
        // Apply shadow class directly
        const header = document.getElementById("header");
        if (header) {
          if (isScrolled) {
            header.classList.add("shadow-md");
            header.classList.remove("shadow-sm");
          } else {
            header.classList.remove("shadow-md");
            header.classList.add("shadow-sm");
          }
        }
      }

      // Show/hide back to top button
      setShowBackToTop(window.scrollY > 300);

      // Update active section based on scroll position - more robust implementation
      const sections = [
        "home",
        "services",
        "features",
        "testimonials",
        "contact",
      ];

      // Calculate current scroll position accounting for header
      const scrollPosition = window.scrollY + headerHeight;

      // Find the section that should be active
      let newActiveSection = "home"; // Default to home

      // Check each section
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;

          // If we've scrolled past the top of this section and not past its bottom
          if (
            scrollPosition >= offsetTop - headerHeight &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            newActiveSection = section;
            break;
          }
        }
      }

      // Update active section if changed
      if (newActiveSection !== activeSection) {
        setActiveSection(newActiveSection);
      }
    };

    // Function to update header height and related measurements
    const updateHeaderHeight = () => {
      if (header) {
        const height = header.offsetHeight;
        setHeaderHeight(height);

        // Only apply padding to the main element in this page, not the body
        const mainElement = document.querySelector("main");
        if (mainElement) {
          mainElement.style.paddingTop = `${height}px`;
        }
      }
    };

    // Initial calculation
    updateHeaderHeight();

    // Event listeners
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateHeaderHeight, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateHeaderHeight);

      // Clean up any padding that might have been applied
      document.body.style.paddingTop = "";
      const mainElement = document.querySelector("main");
      if (mainElement) {
        mainElement.style.paddingTop = "";
      }
    };
  }, [scrolled, activeSection, headerHeight]);

  useEffect(() => {
    // Create intersection observer for animation
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleSections((prev) => [...prev, entry.target.id]);
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    // Observe all section refs
    Object.values(sectionRefs).forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // Check if user has already consented to cookies
    const hasConsented = localStorage.getItem("cookieConsent") === "true";
    setCookieConsentShown(hasConsented);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    setActiveSection(id);

    // Special case for home
    if (id === "home") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      const headerOffset = headerHeight + 10; // Add some buffer
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const isActive = (section: string) => {
    // For debugging - uncomment if needed
    // console.log('Current active section:', activeSection, 'Checking section:', section);
    return activeSection === section;
  };

  // Function to get the dashboard URL based on user role
  const getDashboardUrl = () => {
    switch (userRole) {
      case "admin":
        return "/dashboard/admin";
      case "doctor":
        return "/dashboard/doctor";
      case "patient":
        return "/dashboard/patient";
      case "lab_technician":
        return "/dashboard/lab";
      case "scan_technician":
        return "/dashboard/scan";
      default:
        return "/dashboard";
    }
  };

  // Helper to check if section is visible
  const isSectionVisible = (sectionId: string) => {
    return visibleSections.includes(sectionId);
  };

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", "true");
    setCookieConsentShown(true);
  };

  // Reset active section to home when mobile menu is opened
  const handleMobileMenuToggle = () => {
    // If we're opening the menu and at the top of the page, ensure home is active
    if (!mobileMenuOpen && window.scrollY < 100) {
      setActiveSection("home");
    }
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Initialize active section based on scroll position when component mounts
  useEffect(() => {
    // Set initial active section based on scroll position
    const scrollPosition = window.scrollY;
    if (scrollPosition < 100) {
      setActiveSection("home");
    }
  }, []);

  return (
    <main className="flex-1 w-full h-full flex flex-col">
      {/* Header - Sticky */}
      <header
        id="header"
        className="w-full bg-white border-b border-gray-100 fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out shadow-sm"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3 md:py-4">
            {/* Logo */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("home");
              }}
              className="flex items-center space-x-2 transition-transform duration-300 ease-in-out hover:scale-105"
            >
              <Image
                src="/images/scanalyze-logo.png"
                alt="Scanalyze Logo"
                width={150}
                height={50}
                className="h-10 md:h-12 w-auto"
                priority
                quality={100}
                unoptimized
              />
            </a>

            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("home");
                }}
                className={`font-medium py-2 transition-all duration-300 ease-in-out border-b-2 ${
                  isActive("home")
                    ? "text-scanalyze-600 border-scanalyze-600"
                    : "text-gray-600 border-transparent hover:text-scanalyze-600 hover:border-scanalyze-300"
                }`}
                aria-current={isActive("home") ? "page" : undefined}
              >
                Home
              </a>
              <a
                href="#services"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("services");
                }}
                className={`font-medium py-2 transition-all duration-300 ease-in-out border-b-2 ${
                  isActive("services")
                    ? "text-scanalyze-600 border-scanalyze-600"
                    : "text-gray-600 border-transparent hover:text-scanalyze-600 hover:border-scanalyze-300"
                }`}
                aria-current={isActive("services") ? "page" : undefined}
              >
                Services
              </a>
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("features");
                }}
                className={`font-medium py-2 transition-all duration-300 ease-in-out border-b-2 ${
                  isActive("features")
                    ? "text-scanalyze-600 border-scanalyze-600"
                    : "text-gray-600 border-transparent hover:text-scanalyze-600 hover:border-scanalyze-300"
                }`}
                aria-current={isActive("features") ? "page" : undefined}
              >
                Features
              </a>
              <a
                href="#testimonials"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("testimonials");
                }}
                className={`font-medium py-2 transition-all duration-300 ease-in-out border-b-2 ${
                  isActive("testimonials")
                    ? "text-scanalyze-600 border-scanalyze-600"
                    : "text-gray-600 border-transparent hover:text-scanalyze-600 hover:border-scanalyze-300"
                }`}
                aria-current={isActive("testimonials") ? "page" : undefined}
              >
                Capabilities
              </a>
            </nav>

            {/* Auth buttons - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <Link href={getDashboardUrl()}>
                  <Button className="scanalyze-button-primary transition-all duration-300 ease-in-out hover:scale-105 flex items-center space-x-2">
                    <UserCircle className="h-5 w-5 mr-1" />
                    <span>Dashboard</span>
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="scanalyze-button-outline transition-all duration-300 ease-in-out hover:scale-105"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="scanalyze-button-primary transition-all duration-300 ease-in-out hover:scale-105">
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button - Visible only on mobile */}
            <div className="md:hidden flex items-center">
              <button
                className="text-gray-500 hover:text-scanalyze-600 transition-colors duration-300 p-2 rounded-md touch-manipulation"
                onClick={handleMobileMenuToggle}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          <div
            className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              mobileMenuOpen
                ? "max-h-[500px] opacity-100 border-t border-gray-100 py-4"
                : "max-h-0 opacity-0"
            }`}
          >
            <nav className="flex flex-col space-y-4 mb-6">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("home");
                }}
                className={`font-medium py-3 transition-colors duration-300 ease-in-out pl-3 ${
                  isActive("home")
                    ? "text-scanalyze-600 border-l-4 border-scanalyze-600"
                    : "text-gray-600 hover:text-scanalyze-600 hover:pl-4"
                } touch-manipulation`}
                aria-current={isActive("home") ? "page" : undefined}
              >
                Home
              </a>
              <a
                href="#services"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("services");
                }}
                className={`font-medium py-3 transition-colors duration-300 ease-in-out pl-3 ${
                  isActive("services")
                    ? "text-scanalyze-600 border-l-4 border-scanalyze-600"
                    : "text-gray-600 hover:text-scanalyze-600 hover:pl-4"
                } touch-manipulation`}
                aria-current={isActive("services") ? "page" : undefined}
              >
                Services
              </a>
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("features");
                }}
                className={`font-medium py-3 transition-colors duration-300 ease-in-out pl-3 ${
                  isActive("features")
                    ? "text-scanalyze-600 border-l-4 border-scanalyze-600"
                    : "text-gray-600 hover:text-scanalyze-600 hover:pl-4"
                } touch-manipulation`}
                aria-current={isActive("features") ? "page" : undefined}
              >
                Features
              </a>
              <a
                href="#testimonials"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("testimonials");
                }}
                className={`font-medium py-3 transition-colors duration-300 ease-in-out pl-3 ${
                  isActive("testimonials")
                    ? "text-scanalyze-600 border-l-4 border-scanalyze-600"
                    : "text-gray-600 hover:text-scanalyze-600 hover:pl-4"
                } touch-manipulation`}
                aria-current={isActive("testimonials") ? "page" : undefined}
              >
                Capabilities
              </a>
            </nav>
            <div className="flex flex-col space-y-3 px-1">
              {isAuthenticated ? (
                <Link
                  href={getDashboardUrl()}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className="scanalyze-button-primary w-full py-6 transition-transform duration-300 hover:scale-105 flex items-center justify-center touch-manipulation">
                    <UserCircle className="h-5 w-5 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="outline"
                      className="scanalyze-button-outline w-full py-6 transition-transform duration-300 hover:scale-105 touch-manipulation"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button className="scanalyze-button-primary w-full py-6 transition-transform duration-300 hover:scale-105 touch-manipulation">
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div
        id="home"
        className="w-full scanalyze-gradient min-h-[92vh] flex items-center"
      >
        <div className="container mx-auto px-4 py-16 md:py-20 lg:py-32 flex flex-col items-center">
          {/* Logo - Visible only on mobile */}
          <div className="md:hidden w-full flex justify-center mb-10 transform transition-transform duration-700 hover:scale-105">
            {isLoading ? (
              <Skeleton className="w-[320px] h-[120px] rounded-lg" />
            ) : (
              <Image
                src="/images/scanalyze-logo.png"
                alt="Scanalyze Medical Imaging"
                width={400}
                height={280}
                className="object-contain w-full max-w-[320px]"
                priority
                quality={100}
                unoptimized
              />
            )}
          </div>

          {/* Content container - flex-row only on md+ screens */}
          <div className="w-full flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-12 md:mb-0 md:pr-4 lg:pr-8">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-3/4 mb-4" />
                  <Skeleton className="h-12 w-1/2 mb-8" />
                  <Skeleton className="h-6 w-full mb-3" />
                  <Skeleton className="h-6 w-5/6 mb-3" />
                  <Skeleton className="h-6 w-4/6 mb-8" />
                  <div className="flex flex-col sm:flex-row gap-4 md:gap-5">
                    <Skeleton className="h-14 w-full sm:w-36" />
                    <Skeleton className="h-14 w-full sm:w-36" />
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-scanalyze-800 mb-6 md:mb-8 leading-tight">
                    Advanced Medical Diagnostics{" "}
                    <span className="text-scanalyze-600">Simplified</span>
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-8 md:mb-10 max-w-xl">
                    Scanalyze delivers cutting-edge laboratory testing and
                    medical imaging with fast, accurate results. Your complete
                    health information at your fingertips.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 md:gap-5">
                    <Link href="/login">
                      <Button
                        size="lg"
                        className="scanalyze-button-primary px-6 sm:px-8 py-6 sm:py-7 text-base sm:text-lg h-auto w-full sm:w-auto transition-transform duration-300 hover:scale-105 touch-manipulation"
                      >
                        Get Started{" "}
                        <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button
                        size="lg"
                        variant="outline"
                        className="scanalyze-button-outline px-6 sm:px-8 py-6 sm:py-7 text-base sm:text-lg h-auto w-full sm:w-auto transition-transform duration-300 hover:scale-105 touch-manipulation"
                      >
                        Learn More
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Logo - Hidden on mobile, visible on md+ screens */}
            <div className="hidden md:flex md:w-1/2 justify-center transform transition-transform duration-700 hover:scale-105">
              {isLoading ? (
                <Skeleton className="w-[500px] h-[350px] rounded-lg" />
              ) : (
                <Image
                  src="/images/scanalyze-logo.png"
                  alt="Scanalyze Medical Imaging"
                  width={600}
                  height={420}
                  className="object-contain w-full max-w-[500px] lg:max-w-[600px]"
                  priority
                  quality={100}
                  unoptimized
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div
        id="services"
        ref={sectionRefs.services}
        className={`py-12 sm:py-16 md:py-20 lg:py-24 bg-gray-50 transition-opacity duration-1000 ease-in-out ${
          isSectionVisible("services") ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-scanalyze-800 mb-3 sm:mb-4">
              Our Comprehensive Services
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Advanced diagnostic services powered by AI technology and expert
              medical analysis
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Service Card 1 - Enhanced */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 hover:border-scanalyze-200 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-scanalyze-100 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="bg-gradient-to-br from-scanalyze-500 to-scanalyze-600 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Microscope className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-scanalyze-800 mb-4 group-hover:text-scanalyze-600 transition-colors duration-300">
                Laboratory Testing
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Complete Blood Count (CBC), diabetes screening, kidney function
                tests, liver function panels, and comprehensive metabolic
                profiles.
              </p>
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("features");
                }}
                className="inline-flex items-center text-scanalyze-600 font-semibold group-hover:text-scanalyze-700 transition-colors duration-300"
              >
                Learn more{" "}
                <MoveRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
              </a>
            </div>

            {/* Service Card 2 - Enhanced */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 hover:border-blue-200 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <PieChart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-scanalyze-800 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                AI-Powered Medical Imaging
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Brain analysis, lung screening (X-ray & plasma), kidney imaging,
                retinal scans for diabetic retinopathy, and knee analysis.
              </p>
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("features");
                }}
                className="inline-flex items-center text-blue-600 font-semibold group-hover:text-blue-700 transition-colors duration-300"
              >
                Learn more{" "}
                <MoveRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
              </a>
            </div>

            {/* Service Card 3 - Enhanced */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 hover:border-green-200 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-green-100 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-scanalyze-800 mb-4 group-hover:text-green-600 transition-colors duration-300">
                Digital Health Records
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Secure patient portals with complete medical history, test
                results, medication tracking, and real-time health monitoring.
              </p>
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("features");
                }}
                className="inline-flex items-center text-green-600 font-semibold group-hover:text-green-700 transition-colors duration-300"
              >
                Learn more{" "}
                <MoveRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div
        id="features"
        ref={sectionRefs.features}
        className={`py-16 md:py-24 transition-opacity duration-1000 ease-in-out ${
          isSectionVisible("features") ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-scanalyze-800 mb-4">
              Why Choose Scanalyze
            </h2>
            <p className="text-gray-600">
              We combine advanced technology with personalized care to provide
              the best diagnostic experience possible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="flex">
              <div className="mr-4 mt-1">
                <CheckCircle className="h-6 w-6 text-scanalyze-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-scanalyze-800 mb-2">
                  AI-Powered Analysis
                </h3>
                <p className="text-gray-600">
                  Advanced machine learning models analyze medical scans for
                  brain, lung, kidney, retinal, and knee conditions with
                  precision.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex">
              <div className="mr-4 mt-1">
                <CheckCircle className="h-6 w-6 text-scanalyze-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-scanalyze-800 mb-2">
                  Multi-Role Dashboard System
                </h3>
                <p className="text-gray-600">
                  Specialized dashboards for patients, doctors, lab technicians,
                  scan technicians, receptionists, and administrators.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex">
              <div className="mr-4 mt-1">
                <CheckCircle className="h-6 w-6 text-scanalyze-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-scanalyze-800 mb-2">
                  Comprehensive Test Library
                </h3>
                <p className="text-gray-600">
                  Complete blood count, diabetes screening, kidney function,
                  liver function tests with automated reference range
                  validation.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex">
              <div className="mr-4 mt-1">
                <CheckCircle className="h-6 w-6 text-scanalyze-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-scanalyze-800 mb-2">
                  Real-Time Health Monitoring
                </h3>
                <p className="text-gray-600">
                  Live dashboards, instant notifications, medical history
                  tracking, and secure patient verification systems.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div
        id="testimonials"
        ref={sectionRefs.testimonials}
        className={`py-16 md:py-24 bg-gray-50 transition-opacity duration-1000 ease-in-out ${
          isSectionVisible("testimonials") ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-scanalyze-800 mb-4">
              Platform Capabilities
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comprehensive medical diagnostic platform features designed for
              modern healthcare
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Capability 1 - Enhanced */}
            <div className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 hover:border-scanalyze-200 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-scanalyze-100 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="bg-gradient-to-br from-scanalyze-500 to-scanalyze-600 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Stethoscope className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-scanalyze-800 mb-4 group-hover:text-scanalyze-600 transition-colors duration-300">
                Patient Portal Features
              </h3>
              <ul className="text-gray-600 space-y-2 leading-relaxed">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-scanalyze-500 mr-2 flex-shrink-0" />{" "}
                  Medical history management
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-scanalyze-500 mr-2 flex-shrink-0" />{" "}
                  Test result viewing
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-scanalyze-500 mr-2 flex-shrink-0" />{" "}
                  Scan image analysis
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-scanalyze-500 mr-2 flex-shrink-0" />{" "}
                  Medication tracking
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-scanalyze-500 mr-2 flex-shrink-0" />{" "}
                  Secure health records
                </li>
              </ul>
            </div>

            {/* Capability 2 - Enhanced */}
            <div className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 hover:border-blue-200 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-scanalyze-800 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                Multi-User System
              </h3>
              <ul className="text-gray-600 space-y-2 leading-relaxed">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />{" "}
                  Patient dashboards
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />{" "}
                  Admin management
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />{" "}
                  Lab technician interface
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />{" "}
                  Scan technician tools
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />{" "}
                  Receptionist portal
                </li>
              </ul>
            </div>

            {/* Capability 3 - Enhanced */}
            <div className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 hover:border-purple-200 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-100 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <PieChart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-scanalyze-800 mb-4 group-hover:text-purple-600 transition-colors duration-300">
                AI Integration
              </h3>
              <ul className="text-gray-600 space-y-2 leading-relaxed">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />{" "}
                  Brain scan analysis
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />{" "}
                  Lung imaging (X-ray & plasma)
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />{" "}
                  Kidney condition detection
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />{" "}
                  Retinal screening
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />{" "}
                  Knee joint assessment
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section - Enhanced */}
      <section className="py-20 md:py-24 bg-gradient-to-br from-scanalyze-50 via-white to-blue-50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-scanalyze-100 to-blue-100 rounded-full text-sm font-medium text-scanalyze-700 mb-6">
              <span className="w-2 h-2 bg-scanalyze-500 rounded-full mr-2 animate-pulse"></span>
              Join the future of medical diagnostics
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-scanalyze-800 via-scanalyze-600 to-blue-600 bg-clip-text text-transparent">
                Ready to experience
              </span>
              <br />
              <span className="text-scanalyze-800">
                AI-powered medical diagnostics?
              </span>
            </h2>

            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Access comprehensive laboratory testing, advanced medical imaging
              with AI analysis, and secure digital health records management.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="scanalyze-button-primary px-10 py-7 text-lg h-auto font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                >
                  Create Account
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="scanalyze-button-outline px-10 py-7 text-lg h-auto font-semibold border-2 hover:bg-scanalyze-50 transition-all duration-300 hover:scale-105"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 relative z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center space-y-2">
            {/* Copyright and Description with improved styling */}
            <div className="space-y-2 max-w-2xl mx-auto">
              <p className="text-gray-700 text-lg font-semibold tracking-wide">
                © {new Date().getFullYear()} Scanalyze Medical Platform. All
                rights reserved.
              </p>
              <p className="text-gray-500 text-base leading-relaxed">
                Healthcare technology solutions for modern medical diagnostics.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Cookie Consent Banner */}
      {!cookieConsentShown && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t-2 border-scanalyze-200 z-50 px-4 py-3">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start sm:items-center">
                <Info className="h-5 w-5 text-scanalyze-600 mr-2 flex-shrink-0 mt-0.5 sm:mt-0" />
                <p className="text-sm text-gray-600">
                  We use cookies to enhance your browsing experience, serve
                  personalized content, and analyze our traffic. By clicking
                  "Accept", you consent to our use of cookies.
                </p>
              </div>
              <div className="flex items-center justify-end space-x-3 flex-shrink-0">
                <Link
                  href="/privacy-policy"
                  className="text-sm text-scanalyze-600 underline hover:text-scanalyze-800 transition-colors duration-300"
                >
                  Privacy Policy
                </Link>
                <Button
                  onClick={acceptCookies}
                  className="scanalyze-button-primary text-sm py-1.5 px-4 h-auto"
                >
                  Accept
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 rounded-full bg-scanalyze-600 text-white p-3 shadow-lg transition-all duration-300 ${
          showBackToTop
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        aria-label="Back to top"
      >
        <ChevronUp className="h-6 w-6" />
      </button>
    </main>
  );
}
