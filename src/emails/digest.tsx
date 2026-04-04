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

const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook Marketplace',
  offerup: 'OfferUp',
  craigslist: 'Craigslist',
  ebay: 'eBay',
};

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
            <Heading style={headerTitle}>🏆 MARKET-ALCHEMY DEAL DIGEST</Heading>
            <Text style={headerSub}>
              {alert.item} · {alert.location} · {date}
            </Text>
          </Section>

          {/* Listings */}
          {listings.map((listing, i) => (
            <Section key={`${listing.platform}-${listing.platformListingId}`} style={listingSection}>
              {/* Cover Photo */}
              {listing.imageUrl && (
                <Img
                  src={listing.imageUrl}
                  alt={listing.title}
                  width="600"
                  style={coverPhoto}
                />
              )}

              {/* Rank + Title + Score */}
              <Row>
                <Text style={rankTitle}>
                  #{i + 1} — {listing.title}
                </Text>
              </Row>
              <Row>
                <Text style={scoreLine}>
                  <span style={scoreLabel}>Scout Score: {listing.effectiveScore}</span>
                  {listing.isNew && <span style={newBadge}> 🆕 NEW</span>}
                </Text>
              </Row>

              {/* Meta */}
              <Text style={metaLine}>
                <strong>${listing.price ?? 'N/A'}</strong>
                {' · '}
                {PLATFORM_LABELS[listing.platform] ?? listing.platform}
                {listing.distance && ` · ${listing.distance}`}
              </Text>

              {/* Reason bullets */}
              <Section style={{ margin: '8px 0' }}>
                {listing.reasons.map((reason, j) => (
                  <Text key={j} style={bullet}>
                    • {reason}
                  </Text>
                ))}
              </Section>

              {/* Summary */}
              {listing.summary && (
                <Text style={summary}>{listing.summary}</Text>
              )}

              {/* CTA */}
              <Button style={ctaButton} href={listing.url}>
                → View on {PLATFORM_LABELS[listing.platform] ?? listing.platform}
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
              Sent by Market-Alchemy AI · You&apos;re receiving this because you
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
  marginBottom: '12px',
  objectFit: 'cover' as const,
};
const rankTitle = {
  color: '#f3f4f6',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 4px 0',
};
const scoreLine = { margin: '0 0 8px 0' };
const scoreLabel = {
  color: '#f59e0b',
  fontSize: '15px',
  fontWeight: 'bold',
};
const newBadge = {
  backgroundColor: '#065f46',
  color: '#6ee7b7',
  fontSize: '12px',
  padding: '2px 8px',
  borderRadius: '4px',
  marginLeft: '8px',
};
const metaLine = {
  color: '#9ca3af',
  fontSize: '14px',
  margin: '0 0 8px 0',
};
const bullet = {
  color: '#d1d5db',
  fontSize: '14px',
  margin: '2px 0',
  lineHeight: '20px',
};
const summary = {
  color: '#9ca3af',
  fontSize: '14px',
  lineHeight: '22px',
  fontStyle: 'italic',
  margin: '8px 0',
};
const ctaButton = {
  backgroundColor: '#f59e0b',
  color: '#0f0f0f',
  padding: '10px 20px',
  borderRadius: '6px',
  fontWeight: 'bold',
  fontSize: '14px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '12px 0',
};
const divider = { borderColor: '#374151', margin: '24px 0 0 0' };
const footerSection = { padding: '16px 24px 24px 24px' };
const footerText = { textAlign: 'center' as const, margin: '0 0 8px 0' };
const footerLink = { color: '#f59e0b', fontSize: '13px', textDecoration: 'none' };
const footerSmall = { color: '#4b5563', fontSize: '12px', textAlign: 'center' as const };
