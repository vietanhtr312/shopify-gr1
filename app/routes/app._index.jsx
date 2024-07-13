import { useEffect, useState, useCallback } from "react";
import { json } from "@remix-run/node";
import { useActionData, useNavigation, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
  Form,
  TextField,
  ButtonGroup,
  Select
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";


export const loader = async ({ request }) => {
  await authenticate.admin(request);
  console.log(request)
  return null;
};


export async function action({ request }) {

  // const product = {}
  // product.data = [{ id: 9139402440978, title: 'Attack on titan' },
  // { id: 9139371278610, title: 'Attack On Titan Tập 1 - 3 (Bộ 3 Tập)' }]



  const index = data?.productIndex || '0'
  const productId = product.data[index].id

  if (data?.action === "create") {
    try {
      const newMetafield = new admin.rest.resources.Metafield({ session: session });

      newMetafield.product_id = productId;
      newMetafield.namespace = "custom";
      newMetafield.key = data?.key;
      newMetafield.value = data?.value;
      newMetafield.type = data?.type || "single_line_text_field";

      await newMetafield.save({
        update: true,
      });
    } catch (error) {
      return json({ error: error.message });
    }
  }

  if (data?.action === "update") {
    try {
      const metafield = new admin.rest.resources.Metafield({ session: session });

      metafield.product_id = productId;
      metafield.id = data?.idSubject;
      metafield.value = data?.value;

      await metafield.save({
        update: true,
      });
    } catch (error) {
      return json({ error: error.message });
    }
  }

  if (data?.action === "delete") {
    const deleteItem = await admin.graphql(
      `#graphql
    mutation metafieldDelete($input: MetafieldDeleteInput!) {
      metafieldDelete(input: $input) {
        deletedId
        userErrors {
          field
          message
        }
      }
    }`,
      {
        variables: {
          "input": {
            "id": data?.subject
          }
        },
      },
    )
  }
  

  const metafield = await admin.rest.resources.Metafield.all({
    session: session,
    metafield: { "owner_id": productId, "owner_resource": "product" },
  });

  return {
    metafields: metafield?.data,
    products: product?.data,
    metafieldIndex: data?.metafieldIndex,
    productIndex: index,
    data: data,
  };
};


export default function Index() {

  const nav = useNavigation();
  const actionData = useActionData();
  console.log('actionData', actionData?.data);
  // if(actionData?.error) alert('error', actionData?.error);

  const [value, setValue] = useState("");
  const [newValue, setNewValue] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [key, setKey] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [edited, setEdited] = useState(-1);
  const [create, setCreate] = useState(false);
  const metafields = actionData?.metafields;
  const metafieldIndex = actionData?.metafieldIndex;
  const productIndex = actionData?.productIndex;
  const products = actionData?.products;
  const rows = {
    "single_line_text_field": 1,
    "list.single_line_text_field": 2,
    "json": 4
  }

  const submit = useSubmit();
  const isLoading =
    ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST";

  const start = () => submit({ productIndex: 0, action: "load" }, { replace: true, method: "POST" });

  return (
    <Page>
      <ui-title-bar title="Remix app template">
        <button variant="primary" onClick={start}>
          {actionData ? 'Reload' : 'Start'}
        </button>
      </ui-title-bar>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <InlineStack gap="300">
                  <Box>
                    View metafield of product
                  </Box>
                  <ButtonGroup variant="segmented">
                    {products && products.map((product, index) => {
                      return (
                        <Button key={index} pressed={productIndex === index.toString()}
                          onClick={() => {
                            console.log('index', index)
                            submit({ productIndex: index }, { method: "POST" })
                          }
                          }
                        >
                          Product {index}</Button>
                      )
                    })}
                  </ButtonGroup>
                </InlineStack>
                <Box
                  padding="400"
                  background="bg-surface-active"
                  borderWidth="025"
                  borderRadius="200"
                  borderColor="border"
                  overflowX="scroll"
                >
                  <pre style={{ margin: 0 }}>
                    {metafields && metafields.map((metafield, index) => {
                      return (
                        <>
                          <Card key={index} gap="200">
                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 5 }}>Metafield - {index}</h3>
                            <div>Id : {metafield?.id}</div>
                            <div>Namespace : {metafield?.namespace}</div>
                            <div>Key : {metafield?.key}</div>
                            <div>Value : {metafield?.value}</div>
                            <div>Description : {metafield?.description || 'null'}</div>
                            <div>Type : {metafield?.type}</div>
                            <div style={{ marginTop: 10, width: '200px' }}>
                              <Button
                                fullWidth
                                textAlign="left"
                                disclosure={expanded ? 'up' : 'down'}
                                onClick={() => setExpanded(!expanded)}
                              >
                                {expanded ? 'Show less' : 'Show more'}
                              </Button>
                            </div>
                            {expanded && (
                              <code style={{ margin: 0 }}>
                                {JSON.stringify(metafield, null, 2)}
                              </code>
                            )}
                            <br></br>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <Button onClick={() => {
                                edited === -1 ? setEdited(index) : setEdited(-1)
                                if (edited !== -1) {
                                  setValue('')
                                }
                              }}>{edited === -1 ? 'Edit' : 'Cancel'}</Button>

                              <span style={{ width: 200 }}></span>
                              <Button
                                variant="primary"
                                tone="critical"
                                onClick={() => { submit({ action: "delete", subject: metafield?.admin_graphql_api_id }, { method: "post" }) }}
                              >
                                Delete
                              </Button>
                            </div>
                            {
                              (edited === index) && (
                                <Box background="#555">
                                  <br />
                                  <TextField
                                    label="Value"
                                    value={value}
                                    onChange={(value) => setValue(value)}
                                    multiline={rows[metafield?.type]}
                                    helpText={`* must compatible with type '${metafield?.type}'`}
                                    autoComplete="off"
                                  />
                                  <br />
                                  <Button
                                    variant="primary"
                                    onClick={() => {
                                      submit({
                                        action: "update", idSubject: metafield.id, metafieldIndex, value
                                      },
                                        { method: "post" })
                                      setValue('')
                                      setEdited(-1)
                                    }}
                                  >
                                    Submit</Button>
                                </Box>
                              )
                            }
                          </Card>
                        </>
                      )
                    })
                    }
                  </pre>
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              {
                actionData?.data && (
                  <Card>
                    <Button fullWidth onClick={() => {
                      setCreate(!create)
                      create ? setKey('') : null
                      create ? setNewValue('') : null
                    }}>{create ? 'Cancel' : 'Create new metafield'}</Button>

                    {create && (
                      <Form>
                        <br />
                        <TextField
                          label="Key"
                          value={key}
                          onChange={(value) => setKey(value)}
                          autoComplete="off"
                        />
                        <Select
                          label="Type"
                          options={[
                            { label: 'single_line_text_field', value: 'single_line_text_field' },
                            { label: 'list.single_line_text_field', value: 'list.single_line_text_field' },
                            { label: 'json', value: 'json' }
                          ]}
                          onChange={(value) => setSelectedType(value)}
                          value={selectedType}
                        />

                        <TextField
                          label="Value"
                          value={newValue}
                          onChange={(value) => setNewValue(value)}
                          multiline={rows[selectedType]}
                          autoComplete="off"
                        />

                        <br />
                        <Button variant="primary" onClick={() => {
                          submit({ action: 'create', productIndex, key, value: newValue, type: selectedType }, { method: 'post' })
                          setCreate(false)
                          setKey('')
                          setSelectedType('single_line_text_field')
                          setNewValue('')
                        }}
                        >
                          Create
                        </Button>
                      </Form>
                    )
                    }

                  </Card>
                )
              }

            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
