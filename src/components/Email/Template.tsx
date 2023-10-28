import { type FC } from "react";

import { APP_NAME } from "~/constants";

interface EmailTemplateProps {
  text: string;
}

const EmailTemplate: FC<Readonly<EmailTemplateProps>> = ({
  text,
}) => (
  <div className="w-full flex justify-center">
    <div className="container">
      <h1>{APP_NAME}</h1>
      <div dangerouslySetInnerHTML={{ __html: text }}></div>
    </div>
  </div>
);

export default EmailTemplate;
