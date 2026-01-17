import { parseString } from "xml2js";
import { stripPrefix, parseNumbers } from "xml2js/lib/processors";
import { pdf } from "@react-pdf/renderer";
import GeneratePDF from "./renderer";
import dataExtractor from "./dataExtractor";
import type { InvoiceJSON } from "./types/DigitalInvoiceJson";
import type { Options } from "./types/Options";

const defaultOptions: Options = {
	locale: "it",
	footer: true,
	colors: {},
};

export const xmlToJson = async (xml: string): Promise<InvoiceJSON> => {
	return new Promise((resolve, reject) => {
		parseString(
			xml,
			{
				async: true,
				trim: true,
				explicitArray: false,
				attrkey: "attributes",
				tagNameProcessors: [stripPrefix],
				attrNameProcessors: [stripPrefix],
				valueProcessors: [parseNumbers],
			},
			(error: Error | null, result: any) => {
				if (error) {
					reject(error);
				} else {
					resolve(result as InvoiceJSON);
				}
			}
		);
	});
};

export const xmlToCompactJson = async (
	xml: string
) => {
	try {
		const parsedJson = await xmlToJson(xml);
		return dataExtractor(parsedJson);
	} catch (error) {
		throw new Error(error?.toString());
	}
};

export const xmlToPDF = async (
	xml: string,
	options: Options = defaultOptions
): Promise<Blob> => {
	try {
		const parsedJson = await xmlToCompactJson(xml);
		const doc = GeneratePDF(parsedJson, options);
		const asPdf = pdf(doc);
		const blob = await asPdf.toBlob();
		return blob;
	} catch (error) {
		throw new Error(error?.toString());
	}
};
