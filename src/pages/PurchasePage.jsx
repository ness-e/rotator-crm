/**
 * @file PurchasePage.jsx
 * @description Componente de página (Vista) para la sección PurchasePage.
 * @module Frontend Page
 * @path /frontend/src/pages/PurchasePage.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ShoppingCart, Zap, Users, Building2, Rocket } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const PRODUCTS = [
    {
        code: 'RSIP',
        name: 'Individual Plan',
        version: 'IN',
        price: 99,
        currency: 'USD',
        period: 'year',
        description: 'Perfect for individual researchers and students',
        icon: Users,
        color: 'bg-blue-500',
        features: [
            'Single user license',
            'All survey types (CAWI, PAPI, CATI, CAPI)',
            'Unlimited surveys',
            'Email support',
            'Regular updates',
        ],
    },
    {
        code: 'RSTBP',
        name: 'Team Basic',
        version: 'TB',
        price: 299,
        currency: 'USD',
        period: 'year',
        description: 'Great for small teams and startups',
        icon: Users,
        color: 'bg-green-500',
        popular: true,
        features: [
            'Up to 5 users',
            'All survey types',
            'Unlimited surveys',
            'Priority email support',
            'Team collaboration',
            'Regular updates',
        ],
    },
    {
        code: 'RSTPP',
        name: 'Team Premier',
        version: 'TP',
        price: 599,
        currency: 'USD',
        period: 'year',
        description: 'Advanced features for growing teams',
        icon: Rocket,
        color: 'bg-purple-500',
        features: [
            'Up to 15 users',
            'All survey types',
            'Unlimited surveys',
            'Priority support',
            'Advanced analytics',
            'Custom branding',
            'API access',
        ],
    },
    {
        code: 'RSTP',
        name: 'Teams Plan',
        version: 'FX',
        price: 999,
        currency: 'USD',
        period: 'year',
        description: 'Complete solution for large teams',
        icon: Building2,
        color: 'bg-orange-500',
        features: [
            'Up to 50 users',
            'All survey types',
            'Unlimited surveys',
            '24/7 priority support',
            'Advanced analytics',
            'Custom branding',
            'API access',
            'Dedicated account manager',
        ],
    },
    {
        code: 'RSEP',
        name: 'Enterprise',
        version: 'EN',
        price: 1999,
        currency: 'USD',
        period: 'year',
        description: 'Enterprise-grade solution with unlimited users',
        icon: Building2,
        color: 'bg-red-500',
        features: [
            'Unlimited users',
            'All survey types',
            'Unlimited surveys',
            '24/7 premium support',
            'Advanced analytics',
            'Custom branding',
            'Full API access',
            'Dedicated account manager',
            'Custom integrations',
            'SLA guarantee',
        ],
    },
];

export default function PurchasePage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(null);

    const handlePurchase = async (product) => {
        setLoading(product.code);

        try {
            // Simular proceso de compra
            // En producción, aquí iría la integración con PayPal SDK
            toast({
                title: 'Purchase initiated',
                description: `Redirecting to PayPal for ${product.name}...`,
            });

            // Simular delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // En producción, PayPal redirigiría aquí después del pago
            // Por ahora, simular éxito y redirigir a registro
            const mockTxnId = 'TEST_' + Date.now();

            toast({
                title: 'Purchase successful!',
                description: 'Please complete your registration to activate your license.',
            });

            // Redirigir a registro con parámetros
            navigate(`/register?id=${mockTxnId}&correo_paypal=&version_letra=${product.version}&product=${product.code}`);

        } catch (error) {
            toast({
                title: 'Purchase failed',
                description: error.message || 'Please try again later.',
                variant: 'destructive',
            });
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            {/* Header */}
            <div className="container mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Choose Your Plan
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                        Select the perfect plan for your research needs. All plans include full access to our survey platform.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {PRODUCTS.map((product) => {
                        const Icon = product.icon;
                        const isLoading = loading === product.code;

                        return (
                            <Card
                                key={product.code}
                                className={`relative border-2 transition-all hover:scale-105 ${product.popular
                                    ? 'border-green-500 shadow-lg shadow-green-500/20'
                                    : 'border-slate-700 hover:border-slate-600'
                                    } bg-slate-800/50 backdrop-blur`}
                            >
                                {product.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <Badge className="bg-green-500 text-white px-4 py-1">
                                            Most Popular
                                        </Badge>
                                    </div>
                                )}

                                <CardHeader>
                                    <div className={`w-12 h-12 rounded-lg ${product.color} flex items-center justify-center mb-4`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <CardTitle className="text-2xl text-white">{product.name}</CardTitle>
                                    <CardDescription className="text-slate-300">
                                        {product.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    {/* Price */}
                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold text-white">
                                                ${product.price}
                                            </span>
                                            <span className="text-slate-400">/ {product.period}</span>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-3 mb-6">
                                        {product.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-slate-300 text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA Button */}
                                    <Button
                                        onClick={() => handlePurchase(product)}
                                        disabled={isLoading}
                                        className={`w-full ${product.popular
                                            ? 'bg-green-500 hover:bg-green-600'
                                            : 'bg-blue-500 hover:bg-blue-600'
                                            } text-white`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart className="w-4 h-4 mr-2" />
                                                Purchase Now
                                            </>
                                        )}
                                    </Button>

                                    <p className="text-xs text-slate-400 text-center mt-3">
                                        Secure payment via PayPal
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Academic Plan */}
                <div className="mt-12 max-w-4xl mx-auto">
                    <Card className="border-2 border-blue-500 bg-slate-800/50 backdrop-blur">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl text-white">Academic License</CardTitle>
                                    <CardDescription className="text-slate-300">
                                        Special pricing for students and educational institutions
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-300 mb-2">
                                        Contact us for special academic pricing and volume discounts.
                                    </p>
                                    <ul className="space-y-1 text-sm text-slate-400">
                                        <li>• Valid student/faculty ID required</li>
                                        <li>• Up to 50% discount available</li>
                                        <li>• Bulk licensing options</li>
                                    </ul>
                                </div>
                                <Button
                                    variant="outline"
                                    className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                                    onClick={() => window.location.href = 'mailto:sales@rotatorsurvey.com?subject=Academic License Inquiry'}
                                >
                                    Contact Sales
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer Info */}
                <div className="mt-12 text-center text-slate-400 text-sm">
                    <p>All plans include a 30-day money-back guarantee</p>
                    <p className="mt-2">
                        Need help choosing? <a href="mailto:support@rotatorsurvey.com" className="text-blue-400 hover:underline">Contact our sales team</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
