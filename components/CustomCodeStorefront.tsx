interface CustomCodeStorefrontProps {
  customHtml: string
  customCss: string | null
  customJs: string | null
}

export function CustomCodeStorefront({
  customHtml,
  customCss,
  customJs,
}: CustomCodeStorefrontProps) {
  return (
    <>
      {customCss && customCss.trim() && (
        <style
          dangerouslySetInnerHTML={{
            __html: customCss,
          }}
        />
      )}
      <div
        dangerouslySetInnerHTML={{
          __html: customHtml,
        }}
      />
      {customJs && customJs.trim() && (
        <script
          dangerouslySetInnerHTML={{
            __html: customJs,
          }}
        />
      )}
    </>
  )
}
