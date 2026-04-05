import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { Alert, ScoredListing } from '@/types';

interface DigestEmailProps {
  alert: Alert;
  listings: ScoredListing[];
  manageUrl: string;
  unsubscribeUrl: string;
}

export function DigestEmail({ alert, listings, manageUrl, unsubscribeUrl }: DigestEmailProps) {
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Html>
      <Head />
      <Preview>
        {`${listings.length} deals found for "${alert.item}" near ${alert.location}`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={headerTitle}> Belford Tip DEAL DIGEST</Heading>
            <Text style={headerSub}>
              {alert.item} · {alert.location} · {date}
            </Text>
          </Section>

          {/* Listings */}
          {listings.map((listing) => (
            <Section key={`${listing.platform}-${listing.platformListingId}`} style={listingSection}>
              {/* Cover Photo */}
              {listing.imageUrl ? (
                <a href={listing.url} style={{ textDecoration: 'none', display: 'block' }}>
                  <Img
                    src={listing.imageUrl}
                    alt={listing.title}
                    width="600"
                    style={coverPhoto}
                  />
                </a>
              ) : (
                <div style={placeholderPhoto}>
                  <Text style={placeholderText}>📷 No image available</Text>
                </div>
              )}

              {/* PRICE - Make it stand out */}
              <Section style={priceSection}>
                <Text style={priceText}>${listing.price ?? 'Price not listed'}</Text>
              </Section>

              {/* Title */}
              <Row>
                <Text style={titleText}>
                  <a href={listing.url} style={titleLink}>
                    {listing.title}
                  </a>
                </Text>
              </Row>

              {/* Highlights - Emphasized attributes */}
              {listing.highlights && listing.highlights.length > 0 && (
                <Section style={highlightsSection}>
                  {listing.highlights.map((highlight, idx) => (
                    <span key={idx} style={highlightBadge}>
                      {highlight}
                    </span>
                  ))}
                </Section>
              )}

              {/* Listing Info Grid */}
              <Section style={infoGrid}>
                {/* Time Posted */}
                {listing.timePosted && (
                  <Text style={infoLine}>
                    <span style={infoLabel}>Posted:</span> {listing.timePosted}
                  </Text>
                )}
                
                {/* Distance */}
                {listing.distance && (
                  <Text style={infoLine}>
                    <span style={infoLabel}>Distance:</span> {listing.distance}
                  </Text>
                )}

                {/* Photo Count */}
                <Text style={infoLine}>
                  <span style={infoLabel}>Photos:</span> {listing.photoCount} {listing.photoCount === 1 ? 'photo' : 'photos'}
                </Text>

                {/* Seller Reviews */}
                {listing.sellerReviews && (
                  <Text style={infoLine}>
                    <span style={infoLabel}>Seller:</span> ⭐ {listing.sellerReviews}
                  </Text>
                )}
              </Section>

              {/* Full Description */}
              {listing.fullDescription && (
                <Section style={descriptionSection}>
                  <Text style={descriptionTitle}>Description</Text>
                  <Text style={descriptionText}>{listing.fullDescription}</Text>
                </Section>
              )}

              {/* CTA */}
              <Button style={ctaButton} href={listing.url}>
                View Full Listing on OfferUp
              </Button>

              <Hr style={divider} />
            </Section>
          ))}

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              <a href={unsubscribeUrl} style={footerLink}>
                Stop {alert.item} emails
              </a>
              {'  |  '}
              <a href={manageUrl} style={footerLink}>
                Manage all my alerts
              </a>
            </Text>
            <Text style={footerSmall}>
              Sent by Belfort Tips · You&apos;re receiving this because you
              set up a &quot;{alert.item}&quot; alert.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: '#0f0f0f', fontFamily: 'sans-serif' };
const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#1a1a1a',
  borderRadius: '8px',
  overflow: 'hidden',
};
const header = {
  backgroundColor: '#111827',
  padding: '24px',
  borderBottom: '2px solid #f59e0b',
};
const headerTitle = {
  color: '#f59e0b',
  fontSize: '22px',
  margin: '0 0 4px 0',
};
const headerSub = {
  color: '#9ca3af',
  fontSize: '14px',
  margin: 0,
};
const listingSection = { padding: '24px 24px 0 24px' };
const coverPhoto = {
  width: '100%',
  borderRadius: '6px',
  marginBottom: '16px',
  objectFit: 'cover' as const,
};
const placeholderPhoto = {
  width: '100%',
  height: '200px',
  backgroundColor: '#374151',
  borderRadius: '6px',
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
const placeholderText = {
  color: '#9ca3af',
  fontSize: '14px',
  margin: 0,
};
const priceSection = {
  backgroundColor: '#065f46',
  borderLeft: '4px solid #10b981',
  padding: '16px',
  margin: '0 0 16px 0',
  borderRadius: '6px',
};
const priceText = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold' as const,
  margin: 0,
  letterSpacing: '-0.5px',
};
const titleText = {
  color: '#f3f4f6',
  fontSize: '20px',
  fontWeight: 'bold' as const,
  margin: '0 0 16px 0',
  lineHeight: '28px',
};
const titleLink = {
  color: '#f3f4f6',
  textDecoration: 'none',
};
const highlightsSection = {
  margin: '0 0 16px 0',
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '8px',
};
const highlightBadge = {
  display: 'inline-block',
  backgroundColor: '#374151',
  color: '#f59e0b',
  fontSize: '13px',
  fontWeight: 'bold' as const,
  padding: '6px 12px',
  borderRadius: '4px',
  marginRight: '8px',
  marginBottom: '8px',
  border: '1px solid #4b5563',
};
const infoGrid = {
  backgroundColor: '#111827',
  padding: '16px',
  margin: '0 0 16px 0',
  borderRadius: '6px',
  border: '1px solid #374151',
};
const infoLine = {
  color: '#d1d5db',
  fontSize: '14px',
  margin: '6px 0',
  lineHeight: '20px',
};
const infoLabel = {
  color: '#9ca3af',
  fontWeight: 'bold' as const,
  fontSize: '13px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};
const newBadgeInline = {
  backgroundColor: '#065f46',
  color: '#6ee7b7',
  fontSize: '11px',
  padding: '2px 6px',
  borderRadius: '3px',
  marginLeft: '6px',
};
const descriptionSection = {
  backgroundColor: '#1f2937',
  padding: '16px',
  margin: '0 0 16px 0',
  borderRadius: '6px',
  border: '1px solid #374151',
};
const descriptionTitle = {
  color: '#f59e0b',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  margin: '0 0 12px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};
const descriptionText = {
  color: '#e5e7eb',
  fontSize: '14px',
  lineHeight: '22px',
  margin: 0,
  whiteSpace: 'pre-wrap' as const,
};
const ctaButton = {
  backgroundColor: '#f59e0b',
  color: '#0f0f0f',
  padding: '14px 28px',
  borderRadius: '6px',
  fontWeight: 'bold' as const,
  fontSize: '15px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '12px 0',
  width: '100%',
  textAlign: 'center' as const,
};
const divider = { borderColor: '#374151', margin: '24px 0 0 0' };
const footerSection = { padding: '16px 24px 24px 24px' };
const footerText = { textAlign: 'center' as const, margin: '0 0 8px 0' };
const footerLink = { color: '#f59e0b', fontSize: '13px', textDecoration: 'none' };
const footerSmall = { color: '#4b5563', fontSize: '12px', textAlign: 'center' as const };
