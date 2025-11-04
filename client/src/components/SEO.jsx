import { Helmet } from "react-helmet-async";

const SEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  author,
  published,
  modified,
  structuredData,
}) => {
  const siteName = "Campus Matrimony";
  const defaultImage =
    "https://res.cloudinary.com/dkir6pztp/image/upload/v1761749569/logo_xwcdnr.jpg";
  const defaultUrl = "https://campusmatrimony.vercel.app";
  const defaultDescription =
    "Campus Matrimony - The premier matrimonial platform for BRACU community. Find your perfect life partner with advanced search, verified profiles, and secure communication.";

  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const metaDescription = description || defaultDescription;
  const metaImage = image || defaultImage;
  const metaUrl = url || defaultUrl;

  
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Campus Matrimony",
    url: "https://campusmatrimony.vercel.app",
    logo: "https://res.cloudinary.com/dkir6pztp/image/upload/v1761749569/logo_xwcdnr.jpg",
    description:
      "The premier matrimonial platform for BRACU community. Find your perfect life partner with advanced search, verified profiles, and secure communication.",
    sameAs: [
      
    ],
  };

  const finalStructuredData = structuredData || defaultStructuredData;

  return (
    <Helmet>
      {}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      {author && <meta name="author" content={author} />}

      {}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:site_name" content={siteName} />

      {}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {}
      {type === "article" && published && (
        <meta property="article:published_time" content={published} />
      )}
      {type === "article" && modified && (
        <meta property="article:modified_time" content={modified} />
      )}
      {type === "article" && author && (
        <meta property="article:author" content={author} />
      )}

      {}
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={metaUrl} />

      {}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>
    </Helmet>
  );
};

export default SEO;
