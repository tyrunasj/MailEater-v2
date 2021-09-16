<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:msxsl="urn:schemas-microsoft-com:xslt">

<xsl:template match="/" name="No_Action">
<BusinessObjectList SchemaVersion="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="HierarchicalObjects-1.0.xsd">

		<xsl:variable name="email_recid">
		  <xsl:for-each select="BusinessObjectList/BusinessObject/RelatedBusinessObjectList/RelatedBusinessObject/BusinessObject">
			<xsl:choose>
			  <xsl:when test="@Name = 'Journal.Email'">
				<xsl:for-each select="./FieldList/Field">
				  <xsl:choose>
					<xsl:when test="@Name = 'RecId'">
					  <xsl:value-of select="."/>
					</xsl:when>
				  </xsl:choose>
				</xsl:for-each>
			  </xsl:when>
			</xsl:choose>
		  </xsl:for-each>
		</xsl:variable>		
		
		<xsl:for-each select="BusinessObjectList/BusinessObject">	
			<xsl:element name="BusinessObject">
				<xsl:attribute name="Name"><xsl:value-of select="'Journal.Email'"/></xsl:attribute>
					<xsl:element name="Transaction">Update</xsl:element>
					<xsl:element name="UniqueKeyList">
						<xsl:element name="UniqueKey">
							<xsl:element name="Field">
								<xsl:attribute name="Name"><xsl:value-of select="'RecId'"/></xsl:attribute>
							</xsl:element>
						</xsl:element>
					</xsl:element>
					<FieldList>
						<xsl:for-each select="EmailMessage/node()">
							<xsl:choose>
								<xsl:when test="name() = 'SubjectID'">
									<xsl:element name="Field">
										<xsl:attribute name="Name"><xsl:text>RecId</xsl:text></xsl:attribute>
										<xsl:attribute name="Type">System.Int32</xsl:attribute>
										<xsl:value-of select="$email_recid"/> 
									</xsl:element>
								</xsl:when>
								<xsl:when test="name() = 'Body'">
									<xsl:element name="Field">
										<xsl:attribute name="Name"><xsl:text>XSC_Dummy</xsl:text></xsl:attribute>
										<xsl:attribute name="Type">System.String</xsl:attribute>
										<xsl:value-of select="'Processed'"/>
									</xsl:element>
								</xsl:when>
							</xsl:choose>
						</xsl:for-each>
					</FieldList>
				</xsl:element>
			</xsl:for-each>	
		</BusinessObjectList>
	</xsl:template>
</xsl:stylesheet>